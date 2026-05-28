import { extract } from '@core/fst/agents/superego'
import { hasSessionSubAgent } from '@core/fst/session/config/shared'
import { SessionEventStore } from '@core/utils'
import { convertToModelMessages, createUIMessageStream } from 'ai'
import { getId } from 'stk/utils'

import evaluateMember from '../runtime/evaluate'
import { releaseWriteLock, setBarrier } from '../runtime/locks'
import pickMembers from '../runtime/pick'
import runMember from '../runtime/runMember'

import type { Message } from '../../types'
import type Group from '../index'
import type { GroupMemberEvaluation, GroupReplyQueueItem } from '../types'

const model_threshold_value = 12
const pick_priority_wait_ms = 4000

export default async (s: Group, message: Message) => {
	await s.getModel()
	await s.getAgents()
	await s.getFolders()

	const total_messages_count = s.context.total_messages_count ?? 0

	if (!s.session.is_runing) {
		s.resetAbort()
		s.context.total_messages_count = total_messages_count + 1

		await s.insertMessage(message)

		s.model_messages.push(message)
		s.ui_messages.push(message)
	}

	s.context.current_messages_count = s.model_messages.length
	s.manual_abort = false
	s.active_turn_id = getId()
	s.reply_queue = []

	await s.runing(true)
	await s.setState()
	s.sync()

	const base_messages = await convertToModelMessages(s.model_messages)
	const turn_id = s.active_turn_id!
	const evaluations = new Map<string, GroupMemberEvaluation>()

	return createUIMessageStream({
		originalMessages: [message],
		generateId: getId,
		execute: async ({ writer }) => {
			const default_candidate_agent_ids = s.agents.map(agent => agent.id)
			const pick_result = await pickMembers(s, base_messages)
			const candidate_agent_ids = pick_result.is_fallback
				? default_candidate_agent_ids
				: pick_result.candidate_agent_ids
			const candidate_rank = new Map(candidate_agent_ids.map((agent_id, index) => [agent_id, index]))
			const total_evaluations = candidate_agent_ids.length
			let queue_waiter = null as null | (() => void)
			let completed_evaluations = 0
			const completed_candidate_agent_ids = new Set<string>()
			let exclusive_agent_id = null as string | null
			let evaluation_gate_closed = false
			const evaluation_abort_controller = new AbortController()

			const notifyQueue = () => {
				queue_waiter?.()
				queue_waiter = null
			}

			const getCandidateRank = (agent_id: string) => candidate_rank.get(agent_id) ?? Number.MAX_SAFE_INTEGER

			const allEvaluationsFinished = () =>
				evaluation_gate_closed || completed_evaluations >= total_evaluations

			const waitForQueue = () =>
				new Promise<void>(resolve => {
					queue_waiter = resolve
				})

			const waitForQueueOrTimeout = (timeout: number) =>
				new Promise<void>(resolve => {
					let settled = false
					const onQueue = () => {
						if (settled) {
							return
						}

						settled = true
						clearTimeout(timer)
						queue_waiter = null
						resolve()
					}
					const timer = setTimeout(() => {
						if (settled) {
							return
						}

						settled = true

						if (queue_waiter === onQueue) {
							queue_waiter = null
						}

						resolve()
					}, timeout)

					queue_waiter = onQueue
				})

			const updateQueueItem = async (item: GroupReplyQueueItem, patch: Partial<GroupReplyQueueItem>) => {
				Object.assign(item, patch)
				await s.setState()
				s.sync()
			}

			const setQueue = async (items: Array<GroupReplyQueueItem>) => {
				s.reply_queue = items.map((item, index) => {
					item.queue_index = index

					return item
				})
				await s.setState()
				s.sync()
			}

			const closeEvaluationGate = () => {
				if (evaluation_gate_closed) {
					return
				}

				evaluation_gate_closed = true
				evaluation_abort_controller.abort()
				notifyQueue()
			}

			const markEvaluationCompleted = (agent_id: string) => {
				if (completed_candidate_agent_ids.has(agent_id)) {
					return
				}

				completed_candidate_agent_ids.add(agent_id)
				completed_evaluations += 1
			}

			const enqueueEvaluation = async (evaluation: GroupMemberEvaluation) => {
				if (!evaluation.should_answer) {
					return
				}

				if (s.active_turn_id !== turn_id || s.manual_abort) {
					return
				}

				if (
					s.reply_queue.some(
						item => item.turn_id === turn_id && item.agent_id === evaluation.agent.id
					)
				) {
					return
				}

				const next_item = {
					turn_id,
					queue_index: s.reply_queue.length,
					agent_id: evaluation.agent.id,
					agent_name: evaluation.agent.name,
					status: 'queued',
					reason: evaluation.reason,
					confidence: evaluation.confidence,
					leadership: evaluation.leadership,
					exclusive: evaluation.exclusive,
					needs_write_lock: evaluation.needs_write_lock,
					enqueued_at: Date.now(),
					started_at: null,
					finished_at: null,
					error: null
				} satisfies GroupReplyQueueItem

				if (exclusive_agent_id && exclusive_agent_id !== evaluation.agent.id) {
					return
				}

				await setQueue([...s.reply_queue, next_item])
				notifyQueue()
			}

			const processQueue = async () => {
				while (!s.manual_abort && s.active_turn_id === turn_id) {
					const queued_items = s.reply_queue
						.filter(item => item.turn_id === turn_id && item.status === 'queued')
						.sort((a, b) => {
							const rank_diff = getCandidateRank(a.agent_id) - getCandidateRank(b.agent_id)

							if (rank_diff !== 0) {
								return rank_diff
							}

							if (a.exclusive !== b.exclusive) {
								return a.exclusive ? -1 : 1
							}

							return a.enqueued_at - b.enqueued_at
						})
					const next = queued_items[0]

					if (!next) {
						if (allEvaluationsFinished()) {
							break
						}

						await waitForQueue()
						continue
					}

					const higher_priority_pending_ids = candidate_agent_ids
						.slice(0, getCandidateRank(next.agent_id))
						.filter(agent_id => !completed_candidate_agent_ids.has(agent_id))

					if (higher_priority_pending_ids.length > 0 && !allEvaluationsFinished()) {
						await waitForQueueOrTimeout(pick_priority_wait_ms)
						continue
					}

					if (next.exclusive && exclusive_agent_id !== next.agent_id) {
						exclusive_agent_id = next.agent_id
						await setQueue(
							s.reply_queue.filter(
								item =>
									item.turn_id !== turn_id ||
									item.status !== 'queued' ||
									item.agent_id === next.agent_id
							)
						)
						closeEvaluationGate()
					}

					const waiting_agent_ids = s.reply_queue
						.filter(
							item =>
								item.turn_id === turn_id &&
								item.status === 'queued' &&
								item.agent_id !== next.agent_id
						)
						.map(item => item.agent_id)

					await setBarrier(s, {
						leader_agent_id: next.agent_id,
						leader_agent_name: next.agent_name,
						leadership: next.leadership,
						waiting_agent_ids,
						reason: next.reason
					})
					await updateQueueItem(next, {
						status: 'running',
						started_at: Date.now()
					})

					const evaluation = evaluations.get(next.agent_id)

					if (!evaluation) {
						await updateQueueItem(next, {
							status: 'failed',
							finished_at: Date.now(),
							error: 'evaluation missing'
						})
						continue
					}

					try {
						// AI SDK chat processing assumes a single active assistant stream.
						// Interleaving multiple member streams in one response can scramble
						// start/end step state and break reasoning/text chunk ordering.
						const member = await runMember({
							s,
							agent: evaluation.agent,
							evaluation,
							messages: base_messages,
							original_message: message,
							turn_id
						})

						writer.merge(member.stream)
						await member.done

						await updateQueueItem(next, {
							status: 'done',
							finished_at: Date.now()
						})
					} catch (error) {
						await updateQueueItem(next, {
							status: 'failed',
							finished_at: Date.now(),
							error: error instanceof Error ? error.message : String(error)
						})
					}
				}

				await setBarrier(s, null)
			}

			const runEvaluation = async (agent_id: string) => {
				const agent = s.agents.find(item => item.id === agent_id)

				if (!agent) {
					markEvaluationCompleted(agent_id)
					notifyQueue()
					return
				}

				if (exclusive_agent_id && exclusive_agent_id !== agent.id) {
					markEvaluationCompleted(agent.id)
					notifyQueue()
					return
				}

				const evaluation = await evaluateMember(s, agent, base_messages, {
					abort_signal: evaluation_abort_controller.signal
				})
				markEvaluationCompleted(agent.id)

				if (s.active_turn_id !== turn_id) {
					notifyQueue()
					return
				}

				if (exclusive_agent_id && exclusive_agent_id !== agent.id) {
					notifyQueue()
					return
				}

				evaluations.set(agent.id, evaluation)
				await enqueueEvaluation(evaluation)
				notifyQueue()
			}

			try {
				const queue_runner = processQueue()
				await Promise.allSettled(candidate_agent_ids.map(agent_id => runEvaluation(agent_id)))
				notifyQueue()
				await queue_runner
			} finally {
				if (s.write_lock.agent_id) {
					const holder = s.agents.find(agent => agent.id === s.write_lock.agent_id)

					if (holder) {
						await releaseWriteLock(s, holder, true)
					}
				}

				await setBarrier(s, null)
				s.active_turn_id = null
				s.reply_queue = []
				await s.setState()
				await s.stop()

				if (hasSessionSubAgent(s, 'superego_agent')) {
					s.superego_append_count++
					void extract(s)
				} else {
					s.superego_append_count = 0
				}

				if (hasSessionSubAgent(s, 'trim_agent') && s.model_messages.length >= model_threshold_value) {
					try {
						await s.trimMessages()
					} catch {}
				}

				if (!SessionEventStore.listenerCount(`${s.id}/change`)) {
					await s.updateSession({ unread: true })
				}

				s.manual_abort = false
			}
		},
		onError: error => {
			if (s.manual_abort) {
				s.manual_abort = false

				return ''
			}

			return `Group stream error: ${error instanceof Error ? error.message : String(error)}`
		}
	})
}

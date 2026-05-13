import { SessionEventStore } from '@core/utils'
import { convertToModelMessages, createUIMessageStream } from 'ai'
import { getId } from 'stk/utils'

import evaluateMember from '../runtime/evaluate'
import { releaseWriteLock, setBarrier } from '../runtime/locks'
import runMember from '../runtime/runMember'

import type { Message } from '../../types'
import type Group from '../index'
import type { GroupMemberEvaluation, GroupReplyQueueItem } from '../types'

const model_threshold_value = 12

export default async (s: Group, message: Message) => {
	console.log('[group-debug][group.getStream] start', {
		session_id: s.id,
		group_id: s.group_id,
		is_running: s.session.is_runing,
		agent_count: s.agents.length,
		message_id: message.id
	})
	await s.getModel()
	await s.getAgents()
	await s.getFolders()
	console.log('[group-debug][group.getStream] refreshed-members', {
		session_id: s.id,
		group_id: s.group_id,
		agent_count: s.agents.length,
		agents_map_count: s.agents_map.length
	})

	const total_messages_count = s.context.total_messages_count ?? 0

	if (!s.session.is_runing) {
		s.context.total_messages_count = total_messages_count + 1

		await s.insertMessage(message)

		s.model_messages.push(message)
		s.ui_messages.push(message)
	}

	s.context.current_messages_count = s.model_messages.length
	s.manual_abort = false
	s.active_turn_id = getId()
	s.reply_queue = []

	console.log('[group-debug][group.getStream] before-runing', {
		session_id: s.id,
		turn_id: s.active_turn_id
	})
	await s.runing(true)
	await s.setState()
	s.sync()
	console.log('[group-debug][group.getStream] after-runing', {
		session_id: s.id,
		turn_id: s.active_turn_id,
		is_running: s.session.is_runing
	})

	const base_messages = await convertToModelMessages(s.model_messages)
	const turn_id = s.active_turn_id!
	const evaluations = new Map<string, GroupMemberEvaluation>()
	const total_evaluations = s.agents.length
	console.log('[group-debug][group.getStream] prepared', {
		session_id: s.id,
		turn_id,
		total_evaluations,
		model_message_count: s.model_messages.length
	})

	return createUIMessageStream({
		originalMessages: [message],
		generateId: getId,
		execute: async ({ writer }) => {
			let queue_waiter = null as null | (() => void)
			let completed_evaluations = 0

			const notifyQueue = () => {
				queue_waiter?.()
				queue_waiter = null
			}

			const allEvaluationsFinished = () => completed_evaluations >= total_evaluations

			const waitForQueue = () =>
				new Promise<void>(resolve => {
					queue_waiter = resolve
				})

			const updateQueueItem = async (item: GroupReplyQueueItem, patch: Partial<GroupReplyQueueItem>) => {
				Object.assign(item, patch)
				await s.setState()
				s.sync()
				console.log('[group-debug][group.getStream] queue-update', {
					session_id: s.id,
					turn_id,
					agent_id: item.agent_id,
					status: item.status,
					queue_length: s.reply_queue.length,
					patch
				})
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

				s.reply_queue = [
					...s.reply_queue,
					{
						turn_id,
						queue_index: s.reply_queue.length,
						agent_id: evaluation.agent.id,
						agent_name: evaluation.agent.name,
						status: 'queued',
						reason: evaluation.reason,
						confidence: evaluation.confidence,
						leadership: evaluation.leadership,
						needs_write_lock: evaluation.needs_write_lock,
						enqueued_at: Date.now(),
						started_at: null,
						finished_at: null,
						error: null
					}
				]
				await s.setState()
				s.sync()
				console.log('[group-debug][group.getStream] enqueue', {
					session_id: s.id,
					turn_id,
					agent_id: evaluation.agent.id,
					should_answer: evaluation.should_answer,
					leadership: evaluation.leadership,
					queue_length: s.reply_queue.length
				})
				notifyQueue()
			}

			const processQueue = async () => {
				while (!s.manual_abort && s.active_turn_id === turn_id) {
					const next = s.reply_queue.find(
						item => item.turn_id === turn_id && item.status === 'queued'
					)

					if (!next) {
						console.log('[group-debug][group.getStream] queue-empty', {
							session_id: s.id,
							turn_id,
							completed_evaluations,
							total_evaluations
						})
						if (allEvaluationsFinished()) {
							console.log('[group-debug][group.getStream] queue-stop', {
								session_id: s.id,
								turn_id,
								reason: 'all_evaluations_finished_and_queue_empty'
							})
							break
						}

						await waitForQueue()
						continue
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
					console.log('[group-debug][group.getStream] runMember-start', {
						session_id: s.id,
						turn_id,
						agent_id: next.agent_id,
						agent_name: next.agent_name
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
						console.log('[group-debug][group.getStream] runMember-done', {
							session_id: s.id,
							turn_id,
							agent_id: next.agent_id
						})

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
					console.log('[group-debug][group.getStream] evaluation-skip-missing-agent', {
						session_id: s.id,
						turn_id,
						agent_id
					})
					return
				}

				console.log('[group-debug][group.getStream] evaluation-start', {
					session_id: s.id,
					turn_id,
					agent_id: agent.id,
					agent_name: agent.name
				})
				const evaluation = await evaluateMember(s, agent, base_messages)
				completed_evaluations += 1
				console.log('[group-debug][group.getStream] evaluation-finish', {
					session_id: s.id,
					turn_id,
					agent_id: agent.id,
					agent_name: agent.name,
					should_answer: evaluation.should_answer,
					leadership: evaluation.leadership,
					completed_evaluations,
					total_evaluations,
					reason: evaluation.reason
				})

				if (s.active_turn_id !== turn_id) {
					console.log('[group-debug][group.getStream] evaluation-ignored-stale-turn', {
						session_id: s.id,
						turn_id,
						agent_id: agent.id,
						active_turn_id: s.active_turn_id
					})
					notifyQueue()
					return
				}

				evaluations.set(agent.id, evaluation)
				await enqueueEvaluation(evaluation)
				notifyQueue()
			}

			try {
				const queue_runner = processQueue()
				console.log('[group-debug][group.getStream] evaluations-begin', {
					session_id: s.id,
					turn_id,
					total_evaluations
				})
				await Promise.allSettled(s.agents.map(agent => runEvaluation(agent.id)))
				console.log('[group-debug][group.getStream] evaluations-settled', {
					session_id: s.id,
					turn_id,
					completed_evaluations,
					queue_length: s.reply_queue.length
				})
				notifyQueue()
				await queue_runner
			} finally {
				console.log('[group-debug][group.getStream] finally-start', {
					session_id: s.id,
					turn_id,
					queue_length: s.reply_queue.length,
					completed_evaluations,
					total_evaluations,
					is_running: s.session.is_runing
				})
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
				console.log('[group-debug][group.getStream] stopped', {
					session_id: s.id,
					turn_id,
					is_running: s.session.is_runing
				})

				if (s.model_messages.length >= model_threshold_value) {
					try {
						await s.trimMessages()
					} catch (error) {
						console.log('[group-debug][group.getStream] trim-error', {
							session_id: s.id,
							turn_id,
							error: error instanceof Error ? error.message : String(error)
						})
					}
				}

				if (!SessionEventStore.listenerCount(`${s.id}/change`)) {
					await s.updateSession({ unread: true })
				}

				s.manual_abort = false
				console.log('[group-debug][group.getStream] finally-done', {
					session_id: s.id,
					turn_id
				})
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

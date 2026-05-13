import { SessionEventStore } from '@core/utils'
import { convertToModelMessages, createUIMessageStream } from 'ai'
import { getId } from 'stk/utils'

import evaluateMember from '../runtime/evaluate'
import { releaseWriteLock, setBarrier } from '../runtime/locks'
import pickMembers from '../runtime/pickMembers'
import runMember from '../runtime/runMember'

import type { Message } from '../../types'
import type Group from '../index'
import type { GroupMemberEvaluation, GroupReplyQueueItem } from '../types'

const model_threshold_value = 12

export default async (s: Group, message: Message) => {
	await s.getFolders()

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
			let queue_waiter = null as null | (() => void)
			let evaluations_finished = false

			const notifyQueue = () => {
				queue_waiter?.()
				queue_waiter = null
			}

			const waitForQueue = () =>
				new Promise<void>(resolve => {
					queue_waiter = resolve
				})

			const updateQueueItem = async (item: GroupReplyQueueItem, patch: Partial<GroupReplyQueueItem>) => {
				Object.assign(item, patch)
				await s.setState()
				s.sync()
			}

			const enqueueEvaluation = async (
				evaluation: GroupMemberEvaluation,
				source: GroupReplyQueueItem['source']
			) => {
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
						source,
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
				notifyQueue()
			}

			const processQueue = async () => {
				while (!s.manual_abort && s.active_turn_id === turn_id) {
					const next = s.reply_queue.find(
						item => item.turn_id === turn_id && item.status === 'queued'
					)

					if (!next) {
						if (evaluations_finished) {
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

			const runEvaluation = async (agent_id: string, source: GroupReplyQueueItem['source']) => {
				const agent = s.agents.find(item => item.id === agent_id)

				if (!agent) {
					return
				}

				const evaluation = await evaluateMember(s, agent, base_messages)

				if (s.active_turn_id !== turn_id) {
					return
				}

				evaluations.set(agent.id, evaluation)
				await enqueueEvaluation(evaluation, source)
			}

			try {
				const picked_agents = await pickMembers(s, base_messages)
				const picked_ids = picked_agents.map(item => item.agent_id)
				const picked_id_set = new Set(picked_ids)
				const rest_ids = s.agents
					.map(agent => agent.id)
					.filter(agent_id => !picked_id_set.has(agent_id))
				const queue_runner = processQueue()
				const picked_jobs = picked_ids.map(agent_id => runEvaluation(agent_id, 'pick'))
				const rest_jobs = Promise.resolve().then(() =>
					Promise.allSettled(rest_ids.map(agent_id => runEvaluation(agent_id, 'background')))
				)

				await Promise.allSettled([...picked_jobs, rest_jobs])
				evaluations_finished = true
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

				if (s.model_messages.length >= model_threshold_value) {
					await s.trimMessages()
				}

				await s.stop()

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

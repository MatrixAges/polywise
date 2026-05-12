import { SessionEventStore } from '@core/utils'
import { convertToModelMessages, createUIMessageStream } from 'ai'
import { eq } from 'drizzle-orm'
import { getId } from 'stk/utils'

import evaluateMember from '../runtime/evaluate'
import { releaseWriteLock, setBarrier } from '../runtime/locks'
import runMember from '../runtime/runMember'

import type { Message } from '../../types'
import type Group from '../index'

const model_threshold_value = 12

export default async (s: Group, message: Message) => {
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

	await s.runing(true)
	s.sync()

	const base_messages = await convertToModelMessages(s.model_messages)
	const evaluations = await Promise.all(s.agents.map(agent => evaluateMember(s, agent, base_messages)))
	const selected = evaluations.filter(item => item.should_answer)
	const effective_selected = selected.length ? selected : evaluations.slice(0, 1)
	const leader = effective_selected.find(item => item.leadership === 'blocking') ?? null
	const first_wave = leader ? [leader] : effective_selected
	const second_wave = leader ? effective_selected.filter(item => item.agent.id !== leader.agent.id) : []

	if (leader) {
		await setBarrier(s, {
			leader_agent_id: leader.agent.id,
			leader_agent_name: leader.agent.name,
			leadership: leader.leadership,
			waiting_agent_ids: second_wave.map(item => item.agent.id),
			reason: leader.reason
		})
	} else {
		await setBarrier(s, null)
	}

	return createUIMessageStream({
		originalMessages: [message],
		generateId: getId,
		execute: async ({ writer }) => {
			const runWave = async (items: typeof effective_selected) => {
				const members = await Promise.all(
					items.map(item =>
						runMember({
							s,
							agent: item.agent,
							evaluation: item,
							messages: base_messages,
							original_message: message,
							turn_id: s.active_turn_id!
						})
					)
				)

				members.forEach(item => {
					writer.merge(item.stream)
				})

				await Promise.all(members.map(item => item.done))
			}

			try {
				await runWave(first_wave)

				if (leader) {
					await setBarrier(s, null)
				}

				if (second_wave.length) {
					await runWave(second_wave)
				}
			} finally {
				if (s.write_lock.agent_id) {
					const holder = s.agents.find(agent => agent.id === s.write_lock.agent_id)

					if (holder) {
						await releaseWriteLock(s, holder, true)
					}
				}

				await setBarrier(s, null)
				s.active_turn_id = null
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

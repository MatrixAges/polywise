import { group, group_agent, group_session, message } from '@core/db/schema'
import { getGroupAgents, getGroups, getGroupSessions, getMessages } from '@core/db/services'
import { asc, desc, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

import type { Message } from '@core/fst'

const input_type = object({
	id: string().optional()
})

const getMessageText = (message_item: Message) => {
	if (!Array.isArray(message_item.parts)) return ''

	const text_parts = [] as Array<string>

	for (const part of message_item.parts) {
		if (part.type === 'text' && 'text' in part && typeof part.text === 'string') {
			text_parts.push(part.text)
		}
	}

	return text_parts.join('\n').trim()
}

export default p.input(input_type).query(async ({ input }) => {
	const groups = await getGroups({
		where: input.id ? eq(group.id, input.id) : undefined,
		orderBy: asc(group.updated_at)
	})

	return Promise.all(
		groups.map(async item => {
			const [agents, sessions] = await Promise.all([
				getGroupAgents({
					where: eq(group_agent.group_id, item.id)
				}),
				getGroupSessions({
					where: eq(group_session.group_id, item.id)
				})
			])
			const current_session = sessions[0]?.session ?? null
			const last_message_row = current_session
				? await getMessages({
						where: eq(message.session_id, current_session.id),
						orderBy: desc(message.created_at),
						limit: 1
					}).then(res => res[0] ?? null)
				: null
			const last_message = last_message_row ? (JSON.parse(last_message_row.content) as Message) : null
			const last_message_text = last_message ? getMessageText(last_message) : ''

			return {
				...item,
				agents: agents.map(agent_item => agent_item.agent),
				folders: item.folders ?? [],
				session_ids: sessions.map(session_item => session_item.session.id),
				session: current_session,
				last_message: last_message_text
					? {
							sender: last_message?.metadata?.sender || '',
							text: last_message_text
						}
					: null
			}
		})
	)
})

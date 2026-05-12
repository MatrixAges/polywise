import type { ChatEventRes } from '../../types'
import type Group from '../index'

export default async (s: Group) => {
	s.active()

	await Promise.all([s.getAgents(), s.getProject(), s.getMessages()])

	return {
		type: 'sync',
		data: {
			session: s.session,
			messages: s.ui_messages,
			context: s.context,
			archived_at: s.archived_at,
			has_older: s.ui_has_older,
			has_newer: s.ui_has_newer,
			permission: s.permission,
			mode: s.mode,
			group: {
				id: s.group.id,
				name: s.group.name,
				description: s.group.description ?? null
			}
		}
	} as ChatEventRes
}

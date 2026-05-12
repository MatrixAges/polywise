import { group, group_agent, group_folder, group_session } from '@core/db/schema'
import { getGroupAgents, getGroupFolders, getGroups, getGroupSessions } from '@core/db/services'
import { asc, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string().optional()
})

export default p.input(input_type).query(async ({ input }) => {
	const groups = await getGroups({
		where: input.id ? eq(group.id, input.id) : undefined,
		orderBy: asc(group.updated_at)
	})

	return Promise.all(
		groups.map(async item => {
			const [agents, folders, sessions] = await Promise.all([
				getGroupAgents({
					where: eq(group_agent.group_id, item.id)
				}),
				getGroupFolders({
					where: eq(group_folder.group_id, item.id)
				}),
				getGroupSessions({
					where: eq(group_session.group_id, item.id)
				})
			])

			return {
				...item,
				agents: agents.map(agent_item => agent_item.agent),
				folders: folders.map(folder_item => ({
					path: folder_item.path,
					order: folder_item.order
				})),
				session_ids: sessions.map(session_item => session_item.session.id)
			}
		})
	)
})

import { blocked_session_id, global_linkcase_session_id } from '@core/consts'
import { agent_session, group_session, post_session, project_session } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type { Descriptor } from './types'

export default async (id: string) => {
	const [groupRow, agentRow, projectRow, postRow] = await Promise.all([
		env.db.select().from(group_session).where(eq(group_session.session_id, id)).limit(1),
		env.db.select().from(agent_session).where(eq(agent_session.session_id, id)).limit(1),
		env.db.select().from(project_session).where(eq(project_session.session_id, id)).limit(1),
		env.db.select().from(post_session).where(eq(post_session.session_id, id)).limit(1)
	])

	const tags = [] as Descriptor['tags']
	const groupId = groupRow[0]?.group_id ?? null
	const agentId = agentRow[0]?.agent_id ?? null
	const projectId = projectRow[0]?.project_id ?? null
	const hasPost = Boolean(postRow[0])

	if (groupId) tags.push('group')
	if (agentId) tags.push('owner-agent')
	if (id === global_linkcase_session_id) tags.push('linkcase')
	if (id === blocked_session_id) tags.push('blocked')
	if (hasPost) tags.push('post')

	return {
		id,
		scope: groupId
			? { type: 'group' as const, id: groupId }
			: projectId
				? { type: 'project' as const, id: projectId }
				: agentId
					? { type: 'agent' as const, id: agentId }
					: { type: 'global' as const, id: null },
		projectId,
		agentId,
		groupId,
		tags
	} satisfies Descriptor
}

import { getTodoStatusOrder } from '@core/consts/db'
import { group_todo } from '@core/db/schema'
import { getGroupTodos } from '@core/db/services'
import { and, asc, eq, ne } from 'drizzle-orm'

import type Group from '../index'
import type { GroupContext } from '../types'

export default async (s: Group) => {
	const res = await getGroupTodos({
		where: and(eq(group_todo.group_id, s.group_id), ne(group_todo.status, 'archive')),
		orderBy: [getTodoStatusOrder(group_todo.status), asc(group_todo.order)]
	})

	const tasks = res.map(item => {
		const assignee = item.assignee_agent_id ? s.agents.find(agent => agent.id === item.assignee_agent_id) : null

		return {
			todo_id: item.id,
			title: item.title,
			desc: item.description ?? '',
			status: item.status,
			result: item.result ?? undefined,
			error: item.error ?? undefined,
			assignee_agent_id: item.assignee_agent_id ?? undefined,
			started_by_agent_id: item.started_by_agent_id ?? undefined,
			completed_by_agent_id: item.completed_by_agent_id ?? undefined,
			started_at: item.started_at ? item.started_at.getTime() : undefined,
			finished_at: item.finished_at ? item.finished_at.getTime() : undefined,
			...(assignee ? { assignee: assignee.name } : {})
		}
	}) as GroupContext['tasks']

	s.context.tasks = tasks
}

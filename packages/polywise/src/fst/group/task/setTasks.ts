import { group_todo } from '@core/db/schema'
import { addGroupTodo, getGroupTodos, setGroupTodo } from '@core/db/services'
import { and, eq, ne } from 'drizzle-orm'

import type Group from '../index'
import type { GroupContext } from '../types'

export default async (s: Group, v: GroupContext['tasks'], args?: { agent_id?: string; agent_name?: string }) => {
	const tasks = v || []

	if (!tasks.length) {
		await s.getTasks()

		return
	}

	const current_tasks = await getGroupTodos({
		where: and(eq(group_todo.group_id, s.group_id), ne(group_todo.status, 'archive'))
	})

	const by_id = new Map(current_tasks.map(item => [item.id, item]))
	const by_title = new Map(current_tasks.map(item => [item.title, item]))

	for (const [index, task] of tasks.entries()) {
		const found = (task.todo_id && by_id.get(task.todo_id)) || by_title.get(task.title)
		const status = task.status
		const now = new Date()
		const is_terminal = status === 'done' || status === 'canceled' || status === 'error'

		if (found) {
			const updates = {
				title: task.title,
				description: task.desc || undefined,
				status,
				result: task.result ?? undefined,
				error: task.error ?? undefined,
				assignee_agent_id: task.assignee_agent_id ?? found.assignee_agent_id ?? undefined,
				started_at:
					task.started_at != null
						? new Date(task.started_at)
						: status === 'processing' && !found.started_at
							? now
							: found.started_at,
				started_by_agent_id:
					task.started_by_agent_id ??
					found.started_by_agent_id ??
					(status === 'processing' ? args?.agent_id : undefined),
				finished_at:
					task.finished_at != null
						? new Date(task.finished_at)
						: is_terminal
							? (found.finished_at ?? now)
							: null,
				completed_by_agent_id: is_terminal
					? (task.completed_by_agent_id ??
						found.completed_by_agent_id ??
						args?.agent_id ??
						undefined)
					: null
			}

			await setGroupTodo(eq(group_todo.id, found.id), updates)
			continue
		}

		await addGroupTodo({
			group_id: s.group_id,
			title: task.title,
			description: task.desc || undefined,
			status,
			result: task.result ?? undefined,
			error: task.error ?? undefined,
			order: index,
			assignee_agent_id: task.assignee_agent_id ?? args?.agent_id ?? undefined,
			started_at:
				task.started_at != null ? new Date(task.started_at) : status === 'processing' ? now : undefined,
			started_by_agent_id:
				task.started_by_agent_id ?? (status === 'processing' ? args?.agent_id : undefined),
			finished_at: task.finished_at != null ? new Date(task.finished_at) : is_terminal ? now : undefined,
			completed_by_agent_id: is_terminal
				? (task.completed_by_agent_id ?? args?.agent_id ?? undefined)
				: undefined
		})
	}

	await s.getTasks()
}

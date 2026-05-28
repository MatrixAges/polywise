import { group_todo } from '@core/db/schema'
import { addGroupTodo, getGroupTodos, setGroupTodo } from '@core/db/services'
import { and, eq, ne } from 'drizzle-orm'

import type Session from '../../../session'
import type { GroupContext } from '../types'

export default async (s: Session, v: GroupContext['tasks'], args?: { agent_id?: string; agent_name?: string }) => {
	const tasks = v || []

	if (!tasks.length) {
		await s.getTasks()

		return
	}

	const currentTasks = await getGroupTodos({
		where: and(eq(group_todo.group_id, s.group_id), ne(group_todo.status, 'archive'))
	})
	const byId = new Map(currentTasks.map(item => [item.id, item]))
	const byTitle = new Map(currentTasks.map(item => [item.title, item]))

	for (const [index, task] of tasks.entries()) {
		const found = (task.todo_id && byId.get(task.todo_id)) || byTitle.get(task.title)
		const status = task.status
		const now = new Date()
		const isTerminal = status === 'done' || status === 'canceled' || status === 'error'

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
						: isTerminal
							? (found.finished_at ?? now)
							: null,
				completed_by_agent_id: isTerminal
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
			finished_at: task.finished_at != null ? new Date(task.finished_at) : isTerminal ? now : undefined,
			completed_by_agent_id: isTerminal
				? (task.completed_by_agent_id ?? args?.agent_id ?? undefined)
				: undefined
		})
	}

	await s.getTasks()
}

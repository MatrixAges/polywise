import { session_todo, todo } from '@core/db/schema'
import { env } from '@core/env'
import { and, eq, inArray, ne } from 'drizzle-orm'

import type { Todo } from '@core/db'
import type { Context } from '../../types'
import type Index from '../index'

export default async (s: Index, v: Context['tasks']) => {
	const tasks = v || []
	const task_titles = new Set(tasks.map(task => task.title))

	const current_tasks = await env.db
		.select({ todo })
		.from(session_todo)
		.innerJoin(todo, eq(session_todo.todo_id, todo.id))
		.where(and(eq(session_todo.session_id, s.id), ne(todo.status, 'archive')))

	const exist_tasks: Array<Todo> = []
	const archive_tasks: Array<Todo> = []

	for (const item of current_tasks) {
		if (task_titles.has(item.todo.title)) {
			exist_tasks.push(item.todo)
		} else {
			archive_tasks.push(item.todo)
		}
	}

	if (archive_tasks.length > 0) {
		const archive_ids = archive_tasks.map(item => item.id)

		await env.db.update(todo).set({ status: 'archive' }).where(inArray(todo.id, archive_ids))
	}

	const existing_map = new Map(exist_tasks.map(item => [item.title, item]))

	for (const task of tasks) {
		const db_status = task.status
		const found = existing_map.get(task.title)

		if (found) {
			const updates: Record<string, unknown> = {
				status: db_status,
				description: task.desc || undefined,
				result: task.result ?? undefined,
				error: task.error ?? undefined
			}

			if (db_status === 'done' && found.status !== 'done') {
				updates.completed_at = new Date()
			}

			if (db_status !== 'done') {
				updates.completed_at = null
			}

			await env.db.update(todo).set(updates).where(eq(todo.id, found.id))
		} else {
			const [inserted] = await env.db
				.insert(todo)
				.values({
					title: task.title,
					description: task.desc || undefined,
					status: db_status,
					order: exist_tasks.length + tasks.indexOf(task),
					result: task.result ?? undefined,
					error: task.error ?? undefined
				})
				.returning()

			await env.db.insert(session_todo).values({
				session_id: s.id,
				todo_id: inserted.id
			})
		}
	}

	await s.getTasks()
}

import { session_todo, todo } from '@core/db/schema'
import { addSessionTodo, addTodo, getSessionTodos, setTodo } from '@core/db/services'
import { and, eq, inArray, ne } from 'drizzle-orm'

import type { Todo } from '@core/db'
import type { Context } from '../../types'
import type Index from '../index'

export default async (s: Index, v: Context['tasks']) => {
	const tasks = v || []
	const task_titles = new Set(tasks.map(task => task.title))

	const current_tasks = await getSessionTodos({
		where: and(eq(session_todo.session_id, s.id), ne(todo.status, 'archive'))
	})

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

		await setTodo(inArray(todo.id, archive_ids), { status: 'archive' })
	}

	const existing_map = new Map(exist_tasks.map(item => [item.title, item]))

	const status_order_map = new Map<string, number>()

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

			await setTodo(eq(todo.id, found.id), updates)
		} else {
			const current_index = status_order_map.get(db_status) || 0

			status_order_map.set(db_status, current_index + 1)

			const inserted = await addTodo({
				title: task.title,
				description: task.desc || undefined,
				status: db_status,
				order: current_index,
				result: task.result ?? undefined,
				error: task.error ?? undefined
			})

			await addSessionTodo(s.id, inserted.id)
		}
	}

	await s.getTasks()
}

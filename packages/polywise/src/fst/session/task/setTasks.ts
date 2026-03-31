import { session_todo, todo } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type { Context } from '../../types'
import type Index from '../index'

export default async (s: Index, v: Array<Context['tasks'][number]>) => {
	const existing = await env.db
		.select({ todo })
		.from(session_todo)
		.innerJoin(todo, eq(session_todo.todo_id, todo.id))
		.where(eq(session_todo.session_id, s.id))

	const existing_map = new Map(existing.map(item => [item.todo.title, item.todo]))

	for (const task of v) {
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
					order: existing.length + v.indexOf(task),
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

import { session_todo, todo } from '@core/db/schema'
import { env } from '@core/env'
import { and, eq, inArray, ne } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const todos = await env.db
		.select({ todo })
		.from(session_todo)
		.innerJoin(todo, eq(session_todo.todo_id, todo.id))
		.where(and(eq(session_todo.session_id, s.id), ne(todo.status, 'draft')))

	if (todos.length > 0) {
		const todo_ids = todos.map(item => item.todo.id)

		await env.db.update(todo).set({ status: 'archive' }).where(inArray(todo.id, todo_ids))
	}

	await s.getTasks()
}

import { session_todo, todo } from '@core/db/schema'
import { getSessionTodos, setTodo } from '@core/db/services'
import { and, eq, inArray, ne } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const todos = await getSessionTodos({
		where: and(eq(session_todo.session_id, s.id), ne(todo.status, 'archive'))
	})

	if (todos.length > 0) {
		const todo_ids = todos.map(item => item.todo.id)

		await setTodo(inArray(todo.id, todo_ids), { status: 'archive' })
	}

	await s.getTasks()
}

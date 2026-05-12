import { group_todo } from '@core/db/schema'
import { setGroupTodo } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Group from '../index'

export default async (s: Group) => {
	const tasks = (s.context.tasks || []).filter(item => item.todo_id)

	await Promise.all(tasks.map(item => setGroupTodo(eq(group_todo.id, item.todo_id!), { status: 'archive' })))

	await s.getTasks()
}

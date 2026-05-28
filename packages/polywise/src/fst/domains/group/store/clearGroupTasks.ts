import { group_todo } from '@core/db/schema'
import { setGroupTodo } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Session from '../../../session'

export default async (s: Session) => {
	const tasks = ((s.context.tasks || []) as Array<{ todo_id?: string }>).filter(item => item.todo_id)

	await Promise.all(tasks.map(item => setGroupTodo(eq(group_todo.id, item.todo_id!), { status: 'archive' })))

	await s.getTasks()
}

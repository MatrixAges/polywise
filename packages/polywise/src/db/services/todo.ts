import { todo } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { TodoInsert } from '@core/db'

export async function addTodo(values: TodoInsert) {
	const [res] = await env.db.insert(todo).values(values).returning()
	return res
}

export async function setTodo(where: SQL, values: Partial<TodoInsert>) {
	const res = await env.db.update(todo).set(values).where(where).returning()
	return res
}

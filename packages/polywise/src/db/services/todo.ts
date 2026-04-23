import { todo } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { TodoInsert } from '@core/db'

export const addTodo = async (values: TodoInsert) => {
	return env.db
		.insert(todo)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const setTodo = async (where: SQL, values: Partial<TodoInsert>) => {
	return env.db
		.update(todo)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeTodo = async (where: SQL) => {
	return env.db
		.delete(todo)
		.where(where)
		.returning()
		.then(res => res[0])
}

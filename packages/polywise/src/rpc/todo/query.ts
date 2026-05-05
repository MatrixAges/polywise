import { getTodoStatusOrder, todo_visible_status_list } from '@core/consts/db'
import { env } from '@core/env'
import { p } from '@core/utils'
import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm'
import { object, string } from 'zod'

import { project, project_todo, session, session_todo, todo, todo_session } from '../../db/schema'

import type { Session } from '@core/db'

type TodoItem = typeof todo.$inferSelect
type SessionItem = Session | null
type TodoSessionItem = {
	todo: TodoItem
	session: SessionItem
}
type TodoStatus = TodoItem['status']
type TodoGroup = Record<TodoStatus, Array<TodoSessionItem>>

const input_type = object({
	type: string()
})

const status_order = getTodoStatusOrder(todo.status)

const createTodoGroup = () => {
	const grouped_todos = Object.fromEntries(todo_visible_status_list.map(status => [status, []]))

	return grouped_todos as TodoGroup
}

const groupTodosByStatus = (todos: Array<TodoSessionItem>) => {
	const grouped_todos = createTodoGroup()

	for (const todo_item of todos) {
		grouped_todos[todo_item.todo.status].push(todo_item)
	}

	return grouped_todos
}

const getProjectTodoWithSession = async (project_id: string) => {
	return env.db
		.select({ project, todo, session })
		.from(project_todo)
		.innerJoin(project, eq(project_todo.project_id, project.id))
		.innerJoin(todo, eq(project_todo.todo_id, todo.id))
		.leftJoin(todo_session, eq(todo.id, todo_session.todo_id))
		.leftJoin(session, eq(todo_session.session_id, session.id))
		.where(and(eq(project_todo.project_id, project_id), ne(todo.status, 'archive')))
		.orderBy(getTodoStatusOrder(todo.status), asc(todo.order), asc(todo.created_at))
}

const getInboxTodoWithSession = async () => {
	return env.db
		.select({ todo, session })
		.from(todo)
		.leftJoin(session_todo, sql`${todo.id} = ${session_todo.todo_id}`)
		.leftJoin(project_todo, sql`${todo.id} = ${project_todo.todo_id}`)
		.leftJoin(todo_session, sql`${todo.id} = ${todo_session.todo_id}`)
		.leftJoin(session, eq(todo_session.session_id, session.id))
		.where(and(isNull(session_todo.todo_id), isNull(project_todo.todo_id), ne(todo.status, 'archive')))
		.orderBy(getTodoStatusOrder(todo.status), asc(todo.order), asc(todo.created_at))
}

export default p.input(input_type).query(async ({ input }) => {
	if (input.type !== 'inbox') {
		const rows = await getProjectTodoWithSession(input.type)

		return groupTodosByStatus(rows.map(item => ({ todo: item.todo, session: item.session })))
	}

	const rows = await getInboxTodoWithSession()

	return groupTodosByStatus(rows.map(item => ({ todo: item.todo, session: item.session })))
})

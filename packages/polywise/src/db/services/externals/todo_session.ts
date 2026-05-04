import { project_todo, todo, todo_session } from '@core/db/schema'
import { env } from '@core/env'
import { and, eq, inArray, notInArray, SQL } from 'drizzle-orm'

import { getStandaloneTodos, getTodos, setTodo } from '../todo'
import { getProjectTodo } from './project_todo'

type TodoStatus = (typeof todo.$inferSelect)['status']

interface ArgsSyncTodoSessionStatusBySessionId {
	session_id: string
	from_status_list: Array<TodoStatus>
	to_status: TodoStatus
}

interface ArgsSyncTodoSessionStatusByTodoId {
	todo_id: string
	from_status_list: Array<TodoStatus>
	to_status: TodoStatus
}

export const addTodoSession = async (todo_id: string, session_id: string) => {
	return env.db
		.insert(todo_session)
		.values({ todo_id, session_id })
		.returning()
		.then(res => res[0])
}

export const getTodoSession = async (where: SQL) => {
	return env.db
		.select()
		.from(todo_session)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getTodoSessions = async (where: SQL) => {
	return env.db.select().from(todo_session).where(where)
}

const getTodoProjectId = async (todo_id: string) => {
	const project_item = await getProjectTodo({ where: eq(project_todo.todo_id, todo_id), limit: 1 }).then(
		res => res[0]
	)

	return project_item?.project.id
}

const getNextTopOrder = async (args: {
	project_id?: string
	status: TodoStatus
	excluded_todo_ids: Array<string>
	insert_count: number
}) => {
	const { project_id, status, excluded_todo_ids, insert_count } = args
	const where = and(eq(todo.status, status), notInArray(todo.id, excluded_todo_ids))
	const rows = project_id
		? await getProjectTodo({ where: and(eq(project_todo.project_id, project_id), where) })
		: await getStandaloneTodos({ where })

	if (rows.length === 0) {
		return 0
	}

	const min_order = rows.reduce((current_min, item) => {
		return Math.min(current_min, item.todo.order)
	}, rows[0].todo.order)

	return min_order - insert_count
}

const getTodoOrdersByScope = async (args: { todo_list: Array<typeof todo.$inferSelect>; to_status: TodoStatus }) => {
	const { todo_list, to_status } = args
	const todo_scope_list = await Promise.all(
		todo_list.map(async item => ({
			todo_id: item.id,
			project_id: await getTodoProjectId(item.id)
		}))
	)
	const scoped_todo_map = new Map<string, Array<string>>()

	for (const item of todo_scope_list) {
		const scope_key = item.project_id ?? 'inbox'
		const scoped_todo_list = scoped_todo_map.get(scope_key) ?? []

		scoped_todo_list.push(item.todo_id)
		scoped_todo_map.set(scope_key, scoped_todo_list)
	}

	const todo_order_map = new Map<string, number>()

	for (const [scope_key, scoped_todo_list] of scoped_todo_map.entries()) {
		const project_id = scope_key === 'inbox' ? undefined : scope_key
		const next_top_order = await getNextTopOrder({
			project_id,
			status: to_status,
			excluded_todo_ids: scoped_todo_list,
			insert_count: scoped_todo_list.length
		})

		scoped_todo_list.forEach((todo_id, index) => {
			todo_order_map.set(todo_id, next_top_order + index)
		})
	}

	return todo_order_map
}

const getSessionTodoIds = async (session_id: string) => {
	const session_links = await getTodoSessions(eq(todo_session.session_id, session_id))

	return Array.from(new Set(session_links.map(item => item.todo_id)))
}

const syncTodoSessionStatus = async (
	args: ArgsSyncTodoSessionStatusByTodoId | ArgsSyncTodoSessionStatusBySessionId
) => {
	const { from_status_list, to_status } = args
	const target_todo_ids = 'todo_id' in args ? [args.todo_id] : await getSessionTodoIds(args.session_id)

	if (target_todo_ids.length === 0) {
		return []
	}

	const target_todos = await getTodos({
		where: and(inArray(todo.id, target_todo_ids), inArray(todo.status, from_status_list))
	})

	if (target_todos.length === 0) {
		return []
	}

	const todo_order_map = await getTodoOrdersByScope({ todo_list: target_todos, to_status })

	return Promise.all(
		target_todos.map(item =>
			setTodo(eq(todo.id, item.id), {
				status: to_status,
				order: todo_order_map.get(item.id) ?? item.order
			})
		)
	)
}

export const syncTodoSessionStatusBySessionId = async (args: ArgsSyncTodoSessionStatusBySessionId) => {
	return syncTodoSessionStatus(args)
}

export const syncTodoSessionStatusByTodoId = async (args: ArgsSyncTodoSessionStatusByTodoId) => {
	return syncTodoSessionStatus(args)
}

export const removeTodoSession = async (where: SQL) => {
	return env.db
		.delete(todo_session)
		.where(where)
		.returning()
		.then(res => res[0])
}

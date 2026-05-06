import type { RPCOutput } from '@/types'
import type { Session, Todo } from '@core/db'
import type { SessionStatusPayload } from '@core/rpc/session/watchSessionStatus'

type KanbanData = RPCOutput['todo']['query']
type KanbanStatus = keyof KanbanData
type KanbanTodo = KanbanData[KanbanStatus][number]

export const createKanbanData = () => {
	return {
		draft: [],
		processing: [],
		unreview: [],
		done: [],
		canceled: [],
		error: []
	} as KanbanData
}

export const groupTodosByStatus = (items: Array<KanbanTodo>) => {
	const grouped_todos = createKanbanData()

	for (const item of items) {
		grouped_todos[item.todo.status].push(item)
	}

	return grouped_todos
}

export const patchSessionStatus = (item: KanbanTodo, status_map: SessionStatusPayload) => {
	if (!item.session) return item

	const status = status_map[item.session.id]

	if (!status) return item

	return {
		...item,
		todo: {
			...item.todo,
			status: status.status ?? item.todo.status
		} as Todo,
		session: {
			...item.session,
			title: status.title,
			report: status.report,
			is_runing: status.running,
			running_since: status.running_since ? new Date(status.running_since) : null,
			running_done: status.running_done ? new Date(status.running_done) : null,
			unread: status.unread
		} as Session
	}
}

import type { RPCOutput } from '@/types'

type TodoGroup = RPCOutput['todo']['query']

export type TodoItem = TodoGroup[keyof TodoGroup][number]
export type TodoStatus = TodoItem['status']
export type TodoPriority = TodoItem['priority']

export interface ITodoDetailForm {
	title: string
	description: string
	status: TodoStatus
	priority: TodoPriority
	estimate: number | ''
	due_at: string
}

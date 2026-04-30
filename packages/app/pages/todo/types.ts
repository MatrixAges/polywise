import type { Project, Todo } from '@core/db'
import type { LucideIcon } from 'lucide-react'

export type IFilterType = 'all' | 'project'

export interface IPropsMenuItem {
	type: IFilterType
	project?: Project
	selected: boolean
}

export interface IPropsTodoItem {
	item: Todo
	selected: boolean
}

export interface IStatusConfig {
	key: string
	label: string
	icon: LucideIcon
	color: string
}

export interface IPropsStatusGroup {
	status: string
	label: string
	icon: LucideIcon
	color: string
	todos: Array<Todo>
	expanded: boolean
}

export interface IPropsStatusGroupHeader {
	label: string
	icon: LucideIcon
	color: string
	count: number
	expanded: boolean
}

export interface IPropsTodoDetail {
	todo: Todo
}

export interface IPropsTodoDetailFields {
	todo: Todo
}

export interface IPropsTodoDetailDescription {
	todo: Todo
}

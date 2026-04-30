import type { Project, Todo } from '@core/db'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type IFilterType = 'all' | 'project'

export interface IPropsMenuItem {
	type: IFilterType
	project?: Project
	selected: boolean
	count: number
}

export interface IPropsTodoItem {
	item: Todo
	selected: boolean
}

export interface IPriorityConfig {
	key: string
	label: string
	badge_class: string
}

export interface IStatusConfig {
	key: string
	label: string
	icon: LucideIcon
	color: string
	badge_class: string
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

export interface IPropsTodoStatusBadge {
	status: string
}

export interface IPropsTodoPriorityBadge {
	priority: Todo['priority'] | null | undefined
}

export interface IPropsTodoDetailField {
	icon: LucideIcon
	label: string
	children: ReactNode
}

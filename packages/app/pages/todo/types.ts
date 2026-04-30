import type { Project, Todo } from '@core/db'

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

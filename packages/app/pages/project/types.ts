import type { Session } from '@core/db'
import type Model from './model'

export interface IPropsMenu extends Pick<Model, 'projects'> {}

export interface IPropsMenuItem {
	item: Model['projects'][number]
	index: number
}

export interface IPropsSessionItem {
	item: Session
	project_id: string
	project_index: number
	session_index: number
	selected: boolean
	renaming?: boolean
	rename_value?: string
	pin?: boolean
}

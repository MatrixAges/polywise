import type { Session } from '@core/db'
import type Model from './model'

export interface IPropsMenuItem {
	item: Model['projects'][number]
	index: number
	renaming: boolean
	selected: boolean
	expand: boolean
}

export interface IPropsSessionItem {
	item: Session
	projectId: string
	projectIndex: number
	sessionIndex: number
	renaming: boolean
	selected: boolean
}

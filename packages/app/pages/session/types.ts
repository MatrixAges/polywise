import type { Session } from '@core/db'
import type { ReactNode } from 'react'
import type Model from './model'

export interface ISessionMenuData {
	pins: Array<Session>
	sessions: Array<Session>
	pin_map: Record<string, number>
	has_more: boolean
}

export interface IPropsMenuItem {
	item: Model['projects'][number]
	index: number
	renaming: boolean
	selected: boolean
	expand: boolean
}

export interface IPropsProjectMenuItem {
	item: Session
	project_id: string
	project_index: number
	session_index: number
	renaming: boolean
	selected: boolean
}

export interface IPropsSessionMenuItem {
	item: Session
	pin: boolean
	session_index: number
	selected: boolean
	renaming: boolean
	rename_value: string
}

export interface IPropsMenuSessionItem {
	item: Session
	session_index: number
	selected: boolean
	renaming: boolean
	rename_value: string
	title?: ReactNode
	pin?: boolean
	project_index?: number
	class_name?: string
	onClick?: () => void
}

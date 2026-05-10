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
	projectId: string
	projectIndex: number
	sessionIndex: number
	renaming: boolean
	selected: boolean
}

export interface IPropsSessionMenuItem {
	item: Session
	pin: boolean
	sessionIndex: number
	selected: boolean
	renaming: boolean
	renameValue: string
}

export interface IPropsMenuSessionItem {
	item: Session
	sessionIndex: number
	selected: boolean
	renaming: boolean
	renameValue: string
	title?: ReactNode
	pin?: boolean
	projectIndex?: number
	className?: string
	onClick?: () => void
}

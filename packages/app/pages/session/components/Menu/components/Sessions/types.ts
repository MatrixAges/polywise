import type { Session } from '@core/db'
import type { CSSProperties } from 'react'

export interface IPropsSessionItemMenu {
	item: Session
	pin: boolean
	sessionIndex: number
}

export interface IPropsSessionItem {
	item: Session
	pin: boolean
	sessionIndex: number
	selected: boolean
	renaming: boolean
	renameValue: string
	className?: string
	style?: CSSProperties
}

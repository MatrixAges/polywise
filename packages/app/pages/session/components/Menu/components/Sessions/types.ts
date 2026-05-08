import type { Session } from '@core/db'
import type { IPropsSessions } from '../../../../types'

export interface IPropsSessionItemMenu {
	item: Session
	groups: IPropsSessions['groups']
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
}

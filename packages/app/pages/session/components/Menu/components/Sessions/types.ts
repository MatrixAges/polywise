import type { Session } from '@core/db'
import type { IPropsSessions } from '../../../../types'

export interface IPropsSessionItemMenu {
	item: Session
	groups: IPropsSessions['groups']
	pin: boolean
	session_index: number
}

export interface IPropsSessionItem {
	item: Session
	groups: IPropsSessions['groups']
	pin: boolean
	session_index: number
	selected: boolean
	renaming: boolean
	rename_value: string
}

import type { Session } from '@core/db'
import type { IPropsSessions } from '../../../types'

export interface IPropsSessionItemMenu {
	item: Session
	groups: IPropsSessions['groups']
	pin_map: Record<string, number>
	startRenameSession: IPropsSessions['startRenameSession']
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	togglePinSession: (id: string) => void
	moveSessionToGroup: IPropsSessions['moveSessionToGroup']
}

export interface IPropsSessionItem {
	item: Session
	groups: IPropsSessions['groups']
	pin_map: Record<string, number>
	selected_session_id: string
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameSession: IPropsSessions['startRenameSession']
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	togglePinSession: (id: string) => void
	moveSessionToGroup: IPropsSessions['moveSessionToGroup']
}

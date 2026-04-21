import type { Session } from '@core/db'
import type { DragEndEvent } from '@dnd-kit/core'
import type { IPropsGroups } from '../../../types'

export interface IPropsGroupSessionRowMenu {
	group_index: number
	session_index: number
	group_items_count: number
	item: Session
	groups: Array<{ group: string; items: Array<Session> }>
	pin_map: Record<string, number>
	startRenameSession: IPropsGroups['startRenameSession']
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	togglePinSession: (id: string) => void
	sortGroupSession: IPropsGroups['sortGroupSession']
	moveSessionToGroup: IPropsGroups['moveSessionToGroup']
	moveSessionOutGroup: IPropsGroups['moveSessionOutGroup']
}

export interface IPropsGroupSessionRow {
	group_index: number
	session_index: number
	item: Session
	group_items_count: number
	groups: Array<{ group: string; items: Array<Session> }>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameSession: IPropsGroups['startRenameSession']
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	togglePinSession: (id: string) => void
	sortGroupSession: IPropsGroups['sortGroupSession']
	moveSessionToGroup: IPropsGroups['moveSessionToGroup']
	moveSessionOutGroup: IPropsGroups['moveSessionOutGroup']
}

export interface IPropsGroupCardMenu {
	group_index: number
	groups_count: number
	group_name: string
	startRenameGroup: IPropsGroups['startRenameGroup']
	createSession: () => void
	createGroup: () => void
	removeGroup: (group_index: number) => void
	sortGroup: (from: number, to: number) => void
}

export interface IPropsGroupCard {
	group_index: number
	groups: IPropsGroups['groups']
	group_name: string
	items: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameGroup: IPropsGroups['startRenameGroup']
	startRenameSession: IPropsGroups['startRenameSession']
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	removeGroup: (group_index: number) => void
	togglePinSession: (id: string) => void
	sortGroup: (from: number, to: number) => void
	sortGroupSession: IPropsGroups['sortGroupSession']
	moveSessionToGroup: IPropsGroups['moveSessionToGroup']
	moveSessionOutGroup: IPropsGroups['moveSessionOutGroup']
}

export interface IPropsGroupsRoot {
	groups: IPropsGroups['groups']
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameGroup: IPropsGroups['startRenameGroup']
	startRenameSession: IPropsGroups['startRenameSession']
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	removeGroup: (group_index: number) => void
	togglePinSession: (id: string) => void
	sortGroup: (from: number, to: number) => void
	sortGroupSession: IPropsGroups['sortGroupSession']
	moveSessionToGroup: IPropsGroups['moveSessionToGroup']
	moveSessionOutGroup: IPropsGroups['moveSessionOutGroup']
}

export type TDragEndEvent = DragEndEvent

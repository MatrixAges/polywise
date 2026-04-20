import type { Session } from '@core/db'
import type { UIEvent } from 'react'

export interface ISessionMenuGroup {
	group: string
	created_at: number
	updated_at: number
	items: Array<Session>
}

export interface ISessionMenuData {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	pin_map: Record<string, number>
	has_more: boolean
}

export interface IArgsSortGroupSession {
	group_index: number
	from: number
	to: number
}

export interface IArgsMoveSessionToGroup {
	id: string
	group_index: number
}

export interface IArgsMoveSessionOutGroup {
	id: string
	group_index: number
}

export interface IArgsStartRenameGroup {
	group_index: number
	value: string
}

export interface IArgsStartRenameSession {
	id: string
	value: string
}

export interface IPropsGroups {
	groups: Array<ISessionMenuGroup>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameGroup: (args: IArgsStartRenameGroup) => void
	startRenameSession: (args: IArgsStartRenameSession) => void
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	removeGroup: (group_index: number) => void
	togglePinSession: (id: string) => void
	sortGroup: (from: number, to: number) => void
	sortGroupSession: (args: IArgsSortGroupSession) => void
	moveSessionToGroup: (args: IArgsMoveSessionToGroup) => void
	moveSessionOutGroup: (args: IArgsMoveSessionOutGroup) => void
}

export interface IPropsSessions {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameSession: (args: IArgsStartRenameSession) => void
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	togglePinSession: (id: string) => void
	moveSessionToGroup: (args: IArgsMoveSessionToGroup) => void
	onScroll: (event: UIEvent<HTMLDivElement>) => void
}

export interface IPropsMenu {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameGroup: (args: IArgsStartRenameGroup) => void
	startRenameSession: (args: IArgsStartRenameSession) => void
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	removeGroup: (group_index: number) => void
	togglePinSession: (id: string) => void
	sortGroup: (from: number, to: number) => void
	sortGroupSession: (args: IArgsSortGroupSession) => void
	moveSessionToGroup: (args: IArgsMoveSessionToGroup) => void
	moveSessionOutGroup: (args: IArgsMoveSessionOutGroup) => void
	onScroll: (event: UIEvent<HTMLDivElement>) => void
}

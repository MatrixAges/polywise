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
}

export interface IPropsSessions {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_session_id: string
	rename_value: string
}

export interface IPropsMenu {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number
	rename_session_id: string
	rename_value: string
}

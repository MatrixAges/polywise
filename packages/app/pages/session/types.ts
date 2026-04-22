import type { Session } from '@core/db'
import type Model from './model'

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
	rename_group_index: number | undefined
	rename_session_index: number
	value: string
}

export interface IPropsGroups {
	groups: Array<ISessionMenuGroup>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number | undefined
	rename_session_index: number
	rename_value: string
}

export interface IPropsSessions {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number | undefined
	rename_session_index: number
	rename_value: string
	has_more: boolean
	loading: boolean
	loading_more: boolean
}

export interface IPropsMenu extends Pick<Model, 'current_tab'> {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number | undefined
	rename_session_index: number
	rename_value: string
	has_more: boolean
	loading: boolean
	loading_more: boolean
}

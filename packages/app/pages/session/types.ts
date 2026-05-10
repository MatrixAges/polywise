import type { Session } from '@core/db'

export interface ISessionMenuData {
	pins: Array<Session>
	sessions: Array<Session>
	pin_map: Record<string, number>
	has_more: boolean
}

export interface IArgsStartRenameSession {
	pin: boolean
	session_index: number
	value: string
}

export interface IPropsSessions {
	pins: Array<Session>
	sessions: Array<Session>
	selectedSessionId: string
	renamePin: boolean
	renameSessionIndex: number
	renameValue: string
	hasMore: boolean
	loading: boolean
	loadingMore: boolean
}

export interface IPropsMenu {
	pins: Array<Session>
	sessions: Array<Session>
	selectedSessionId: string
	renamePin: boolean
	renameSessionIndex: number
	renameValue: string
	hasMore: boolean
	loading: boolean
	loadingMore: boolean
}

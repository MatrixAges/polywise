import type { Session } from '@core/db'

export interface ISessionMenuGroup {
	group: string
	created_at: number
	updated_at: number
	items: Array<Session>
}

export interface ISessionMenuData {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
}

export interface IPropsGroupItem {
	item: Session
	selected_session_id: string
	setSelectedSession: (id: string) => void
}

export interface IPropsGroupList {
	groups: Array<ISessionMenuGroup>
	selected_session_id: string
	setSelectedSession: (id: string) => void
}

export interface IPropsSessionItem {
	item: Session
	selected_session_id: string
	setSelectedSession: (id: string) => void
}

export interface IPropsSessionList {
	sessions: Array<Session>
	selected_session_id: string
	setSelectedSession: (id: string) => void
	loadMore: () => Promise<void>
}

export interface IPropsMenu {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	selected_session_id: string
	setSelectedSession: (id: string) => void
	loadMore: () => Promise<void>
}

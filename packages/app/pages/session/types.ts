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
}

export interface IPropsGroups {
	groups: Array<ISessionMenuGroup>
	selected_session_id: string
	setSelectedSession: (id: string) => void
}

export interface IPropsSessions {
	sessions: Array<Session>
	selected_session_id: string
	setSelectedSession: (id: string) => void
	onScroll: (event: UIEvent<HTMLDivElement>) => void
}

export interface IPropsMenu {
	groups: Array<ISessionMenuGroup>
	sessions: Array<Session>
	selected_session_id: string
	setSelectedSession: (id: string) => void
	onScroll: (event: UIEvent<HTMLDivElement>) => void
}

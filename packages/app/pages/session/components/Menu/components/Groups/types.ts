import type { Session } from '@core/db'
import type { DragEndEvent } from '@dnd-kit/core'
import type { IPropsGroups } from '../../../../types'

export interface IPropsGroupSessionRowMenu {
	group_index: number
	session_index: number
	group_items_count: number
	item: Session
	groups: Array<{ group: string; items: Array<Session> }>
	pin_map: Record<string, number>
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
}

export interface IPropsGroupCardMenu {
	group_index: number
	groups_count: number
	group_name: string
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
}

export interface IPropsGroupsRoot {
	groups: IPropsGroups['groups']
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number
	rename_session_id: string
	rename_value: string
}

export type TDragEndEvent = DragEndEvent

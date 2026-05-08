import type { Session } from '@core/db'
import type { DragEndEvent } from '@dnd-kit/core'
import type { IPropsGroups } from '../../../../types'

export interface IPropsGroupSessionRowMenu {
	groupIndex: number
	sessionIndex: number
	groupItemsCount: number
	item: Session
	groups: Array<{ group: string; items: Array<Session> }>
	pin: boolean
}

export interface IPropsGroupSessionRow {
	groupIndex: number
	sessionIndex: number
	item: Session
	groupItemsCount: number
	groups: Array<{ group: string; items: Array<Session> }>
	pin: boolean
	selected: boolean
	renaming: boolean
	renameValue: string
}

export interface IPropsGroupCardMenu {
	groupIndex: number
	groupsCount: number
	groupName: string
}

export interface IPropsGroupCard {
	groupIndex: number
	groups: IPropsGroups['groups']
	groupName: string
	items: Array<Session>
	pinMap: Record<string, number>
	selectedSessionId: string
	renameGroupIndex: number | undefined
	renameSessionIndex: number
	renameValue: string
}

export interface IPropsGroupsRoot {
	groups: IPropsGroups['groups']
	pinMap: Record<string, number>
	selectedSessionId: string
	renameGroupIndex: number | undefined
	renameSessionIndex: number
	renameValue: string
}

export type TDragEndEvent = DragEndEvent

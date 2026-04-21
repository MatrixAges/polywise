import type { Session } from '@core/db'
import type { IPropsSessions } from '../../../../types'

export interface IPropsSessionItemMenu {
	item: Session
	groups: IPropsSessions['groups']
	pin_map: Record<string, number>
}

export interface IPropsSessionItem {
	item: Session
	groups: IPropsSessions['groups']
	pin_map: Record<string, number>
	selected_session_id: string
	rename_session_id: string
	rename_value: string
}

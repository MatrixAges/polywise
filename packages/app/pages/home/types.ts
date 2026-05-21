import type { RPCOutput } from '@/types'

export type HomeSnapshot = RPCOutput['home']['query']

export interface HomeOverviewCard {
	key: 'sessions' | 'tokens' | 'content' | 'memory'
	title: string
	value: string
	desc: string
}

export interface HomeModelItem {
	key: string
	title: string
	value: string
}

export interface HomeRuntimeItem {
	key: string
	label: string
	value: string
}

export type HomeRecentSessionItem = HomeSnapshot['recent']['sessions'][number] & {
	status_label: string
	updated_label: string
}

export type HomeRecentPostItem = HomeSnapshot['recent']['posts'][number] & {
	status_label: string
	updated_label: string
}

export type HomeRecentNotificationItem = HomeSnapshot['recent']['notifications'][number] & {
	status_label: string
	created_label: string
}

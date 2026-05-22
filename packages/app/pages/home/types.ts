import type { RPCOutput } from '@/types'

export type HomeSnapshot = RPCOutput['home']['query']
export type HomeTrendPoint = HomeSnapshot['trends'][number]
export type HomeHeatmapPoint = HomeSnapshot['activity_heatmap'][number]
export type HomeOverviewTone =
	| 'sessions'
	| 'running'
	| 'unread'
	| 'messages'
	| 'tokens'
	| 'posts'
	| 'pipeline'
	| 'graph'

export interface HomeOverviewCard {
	key: HomeOverviewTone
	title: string
	value: string
	desc: string
}

export interface HomeModelItem {
	key: string
	title: string
	value: string
	desc?: string
}

export interface HomeRuntimeItem {
	key: string
	label: string
	value: string
}

export interface HomeHeatmapCell extends HomeHeatmapPoint {
	level: number
	score: number
	tooltip: string
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

export type HomeActiveProjectItem = HomeSnapshot['activity']['top_projects'][number] & {
	updated_label: string
}

export type HomeActiveSessionItem = HomeSnapshot['activity']['top_sessions'][number] & {
	updated_label: string
}

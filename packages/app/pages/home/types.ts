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
	title: string
	value: string
}

export interface HomeHeatmapCell extends HomeHeatmapPoint {
	level: number
	score: number
	tooltip: string
}

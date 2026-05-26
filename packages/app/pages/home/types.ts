import type { RPCOutput } from '@/types'

export type HomeStatsPeriod = 'day' | 'week' | 'month' | 'year' | 'total'
export type HomeReportPeriod = Exclude<HomeStatsPeriod, 'total'>
export type HomeSnapshot = RPCOutput['home']['query']
export type HomeTrendPoint = HomeSnapshot['trends'][number]
export type HomeHeatmapPoint = HomeSnapshot['activity_heatmap'][number]
export type HomeReportHistoryItem = HomeSnapshot['pthink']['status']['report_history'][number]
export type HomeReportArticle = RPCOutput['article']['read']
export type HomeGeneratedReport = RPCOutput['report']['query']
export type HomeReportStatus = HomeGeneratedReport['status']
export type HomeAgentStatItem = HomeSnapshot['agents']['top_agents'][number]
export type HomeGroupStatItem = HomeSnapshot['agents']['top_groups'][number]
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

export interface HomeLeaderboardItem {
	key: string
	title: string
	subtitle: string
	meta: string
	value: string
	footnote: string
	photo?: Uint8Array | null
	avatar?: unknown
}

export interface HomeHeatmapCell extends HomeHeatmapPoint {
	level: number
	score: number
	tooltip: string
}

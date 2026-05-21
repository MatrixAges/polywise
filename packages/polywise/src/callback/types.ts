export type ContentSearchAction = 'fullTextSearch' | 'semanticSearch' | 'relationSearch' | 'hybirdSearch'

export interface ContentCallbackSessionRef {
	session_id: string
	session_dir: string
}

export interface ContentSearchTrace {
	trace_id: string
	session_id: string
	created_at: number
	action: ContentSearchAction
	query: string
	normalized_query: string
	center_node_id: string
	article_ids: Array<string>
	applied_hit_items: Array<string>
	applied_miss_items: Array<string>
}

export interface AppliedContentCallbackRecord {
	trace_id: string
	created_at: number
	hit_items: Array<string>
	miss_items: Array<string>
	reason?: string
}

export interface ContentCallbackStore {
	traces: Record<string, ContentSearchTrace>
	applied_callbacks: Record<string, AppliedContentCallbackRecord>
}

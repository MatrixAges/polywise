export interface Filters {
	root_ids?: Array<string>
	idol_id?: string
	context_id?: string
}

export interface Metadata {
	desc?: string
	links?: Array<string>
	files?: Array<string>
	source_confidence?: number
	conflict_score?: number
	conflict_count?: number
	last_verified_at?: string
}

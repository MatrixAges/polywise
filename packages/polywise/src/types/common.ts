export interface Scopes {
	workspace_id?: string
	project_id?: string
	idol_id?: string
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

export type PatchSuggestionLevel = 'observe' | 'patch' | 'escalate'

export interface TelemetryFailureEvent {
	session_id: string
	tool_name: string
	target: string
	error_text: string
	keywords: Array<string>
	created_at: string
}

export interface PatchSuggestion {
	level: PatchSuggestionLevel
	reason: string
	suggested_skill_name: string
	suggested_action: 'observe' | 'update' | 'create'
	confidence: number
}

export interface PatchRecord {
	id: string
	date: string
	session_id: string
	tool_name: string
	target: string
	error_signature: string
	keywords: Array<string>
	seen_count: number
	first_seen_at: string
	last_seen_at: string
	related_examples: Array<string>
	suggestion: PatchSuggestion
	status: 'open' | 'patched'
}

export interface TelemetrySearchArgs {
	app_path: string
	tool_name: string
	keywords: Array<string>
	max_count?: number
}

export interface TelemetryCollectArgs {
	app_path: string
	session_id: string
	tool_name: string
	target: string
	error_text: string
	keywords: Array<string>
}

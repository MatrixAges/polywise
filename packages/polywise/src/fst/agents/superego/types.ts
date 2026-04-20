export type ScopeType = 'global' | 'project' | 'agent'

export type SuperegoToolName = 'memory_tool' | 'wiki_tool' | 'skill_tool'

export type SuperegoToolAction = 'add' | 'search' | 'update' | 'remove' | 'read' | 'create' | 'build'

export interface ComplexitySignal {
	recent_message_count: number
	tool_call_count: number
	distinct_tool_count: number
	error_count: number
	retry_count: number
	has_error_pattern: boolean
	has_retry_pattern: boolean
	reasoning_duration: number
	input_tokens: number
	output_tokens: number
	total_tokens: number
	is_complex: boolean
}

export interface FailureTelemetryRecord {
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
	suggested_skill_name: string
	suggested_action: 'observe' | 'create' | 'update'
	status: 'open' | 'patched'
}

export interface SkillCreatorDraft {
	action: 'create' | 'update' | 'skip'
	reason: string
	name: string
	description: string
	keywords: Array<string>
	content: string
}

export interface SuperegoAction {
	tool: SuperegoToolName
	action: SuperegoToolAction
	target: string
}

export interface SuperegoResult {
	summary: string
	actions: Array<SuperegoAction>
	complexity_signal?: ComplexitySignal
	failure_telemetry?: FailureTelemetryRecord | null
	skill_draft?: SkillCreatorDraft | null
}

export interface SuperegoEvent {
	result: string
	timestamp: number
}

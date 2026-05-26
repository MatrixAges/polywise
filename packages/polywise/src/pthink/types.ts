export type PthinkOutputKind = 'article' | 'skill' | 'tool'

export interface PthinkConfig {
	enabled: boolean
	idle_grace_ms: number
	review_cooldown_ms: number
	min_messages: number
	max_messages: number
	max_articles_per_run: number
	skill_generation_enabled: boolean
	tool_generation_enabled: boolean
	monitor_ms: number
}

export interface PthinkReviewMessage {
	id: string
	session_id: string
	session_title: string
	role: string
	text: string
	created_at: number
}

export interface PthinkReviewWindow {
	start_at: number
	end_at: number
	message_count: number
	session_count: number
	messages: Array<PthinkReviewMessage>
}

export interface PthinkGeneratedArticle {
	title: string
	for_type: 'memory' | 'wiki'
	content: string
	confidence: number
	reason: string
}

export interface PthinkGeneratedSkill {
	action: 'skip' | 'create' | 'update'
	name: string
	description: string
	content: string
	keywords: Array<string>
	confidence: number
	reason: string
}

export interface PthinkGeneratedTool {
	action: 'skip' | 'create'
	name: string
	description: string
	readme: string
	entry: string
	input_schema?: string
	output_schema?: string
	confidence: number
	reason: string
}

export interface PthinkDraftReview {
	title: string
	summary: string
	articles: Array<PthinkGeneratedArticle>
	skill: PthinkGeneratedSkill | null
	tool: PthinkGeneratedTool | null
}

export interface PthinkHistoryRecord {
	title: string
	summary: string
	kinds: Array<PthinkOutputKind>
	article_ids: Array<string>
	skill_names: Array<string>
	tool_names: Array<string>
	message_count: number
	window_start_at: number
	window_end_at: number
	created_at: number
}

export interface PthinkRunSummary extends PthinkHistoryRecord {}

export interface PthinkRuntimeStatus {
	running: boolean
	last_run_at: number | null
	last_report_at: number | null
	last_review_at: number | null
	last_status: 'idle' | 'running' | 'success' | 'error' | 'skipped'
	last_error: string | null
	last_reason: string | null
	last_summary: PthinkRunSummary | null
	boot_at: number
	last_foreground_at: number
	last_visit_at: number
	report_history: Array<PthinkHistoryRecord>
	trigger_last_fired: Record<string, number>
}

export interface PthinkWindowStats {
	sessions: number
	messages: number
	user_messages: number
	assistant_messages: number
	input_tokens: number
	output_tokens: number
	total_tokens: number
	reasoning_tokens: number
	cached_input_tokens: number
	new_posts: number
	new_memory_posts: number
	updated_posts: number
	new_documents: number
	rewire_events: number
	new_notifications: number
	unread_notifications: number
	pending_posts: number
	pending_articles: number
	pending_documents: number
	pending_links: number
}

export interface PthinkAnalyticsSnapshot {
	generated_at: number
	windows: {
		six_hours: PthinkWindowStats
		day: PthinkWindowStats
		week: PthinkWindowStats
	}
	totals: {
		sessions: number
		messages: number
		posts: number
		documents: number
		projects: number
		agents: number
		nodes: number
		edges: number
	}
	top_models: Array<{
		key: string
		label: string
		calls: number
		total_tokens: number
	}>
	active_sessions: Array<{
		id: string
		title: string
		message_count: number
		last_message_at: number
	}>
	active_projects: Array<{
		id: string
		name: string
		session_count: number
		message_count: number
		last_message_at: number
	}>
	recent_posts: Array<{
		id: string
		title: string
		for_type: string
		updated_at: number
	}>
}

export interface PthinkTriggerCandidate {
	key: string
	label: string
	detail: string
	score: number
}

export interface PthinkRuntime {
	monitor_timer: NodeJS.Timeout | null
	status: PthinkRuntimeStatus
	start: () => Promise<void>
	stop: () => Promise<void>
	runNow: (args?: { force?: boolean }) => Promise<PthinkRunSummary | null>
	touchForeground: () => void
	touchVisit: () => void
}

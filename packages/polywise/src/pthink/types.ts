import type { Cron } from 'croner'

export type PthinkReportKind = 'idle' | 'daily' | 'weekly' | 'trigger'

export interface PthinkConfig {
	enabled: boolean
	idle_grace_ms: number
	daily_report_enabled: boolean
	daily_report_hour: number
	weekly_report_enabled: boolean
	weekly_report_weekday: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
	weekly_report_hour: number
	trigger_enabled: boolean
	max_reports_per_day: number
	monitor_ms: number
	trigger_cooldown_ms: number
	idle_report_cooldown_ms: number
}

export interface PthinkTriggerCandidate {
	key: string
	label: string
	detail: string
	score: number
}

export interface PthinkReportRecord {
	post_id: string
	session_id: string | null
	notification_id: string | null
	kind: PthinkReportKind
	title: string
	summary: string
	trigger_key: string | null
	created_at: number
}

export interface PthinkRunSummary {
	kind: PthinkReportKind
	title: string
	summary: string
	post_id: string | null
	session_id: string | null
	trigger_key: string | null
	created_at: number
}

export interface PthinkRuntimeStatus {
	running: boolean
	last_run_at: number | null
	last_report_at: number | null
	last_status: 'idle' | 'running' | 'success' | 'error' | 'skipped'
	last_error: string | null
	last_reason: string | null
	last_summary: PthinkRunSummary | null
	last_foreground_at: number
	last_visit_at: number
	report_history: Array<PthinkReportRecord>
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
	open_todos: number
	pending_posts: number
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

export interface PthinkDraftReport {
	title: string
	summary: string
	content: string
}

export interface PthinkRuntime {
	monitor_timer: NodeJS.Timeout | null
	daily_job: Cron | null
	weekly_job: Cron | null
	status: PthinkRuntimeStatus
	start: () => Promise<void>
	stop: () => Promise<void>
	runNow: (
		kind: PthinkReportKind,
		args?: {
			trigger?: PthinkTriggerCandidate | null
			force?: boolean
			analytics?: PthinkAnalyticsSnapshot
		}
	) => Promise<PthinkRunSummary | null>
	touchForeground: () => void
	touchVisit: () => void
}

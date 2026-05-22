export const report_period_values = ['day', 'week', 'month', 'year'] as const

export type ReportPeriod = (typeof report_period_values)[number]

export interface ReportWindow {
	period: ReportPeriod
	offset: number
	key: string
	label: string
	title: string
	start_at: number
	end_at: number
	file_name: string
	file_path: string
}

export interface ReportModelUsageItem {
	key: string
	label: string
	calls: number
	total_tokens: number
}

export interface ReportProviderUsageItem {
	provider: string
	calls: number
	total_tokens: number
}

export interface ReportSessionItem {
	session_id: string
	title: string
	message_count: number
	last_message_at: number
	is_im: boolean
}

export interface ReportProjectItem {
	project_id: string
	name: string
	session_count: number
	message_count: number
	last_message_at: number
}

export interface ReportAgentChangeItem {
	agent_id: string
	name: string
	new_sessions: number
	new_articles: number
	new_memory_posts: number
	new_wiki_posts: number
}

export interface ReportPostItem {
	id: string
	title: string
	for_type: string
	updated_at: number
}

export interface ReportConversationSample {
	session_id: string
	title: string
	role: string
	text: string
	created_at: number
	is_im: boolean
}

export interface ReportAnalytics {
	window: ReportWindow
	generated_at: number
	usage: {
		message_count: number
		user_message_count: number
		assistant_message_count: number
		total_tokens: number
		input_tokens: number
		output_tokens: number
		reasoning_tokens: number
		cached_input_tokens: number
		models: Array<ReportModelUsageItem>
		providers: Array<ReportProviderUsageItem>
	}
	sessions: {
		new_sessions: number
		active_sessions: number
		im_sessions: number
		top_sessions: Array<ReportSessionItem>
		top_im_sessions: Array<ReportSessionItem>
		top_projects: Array<ReportProjectItem>
	}
	content: {
		new_posts: number
		new_user_posts: number
		new_wiki_posts: number
		new_memory_posts: number
		updated_posts: number
		new_documents: number
		recent_posts: Array<ReportPostItem>
	}
	knowledge: {
		new_nodes: number
		total_nodes: number
		new_edges: number
		total_edges: number
		rewire_events: number
		active_edges: number
		silent_edges: number
		unstable_edges: number
		new_agent_articles: number
		top_agent_changes: Array<ReportAgentChangeItem>
	}
	linkcase: {
		new_links: number
		processed_links: number
		failed_links: number
		pending_links: number
		ready_to_extract: number
	}
	ops: {
		new_notifications: number
		unread_notifications: number
		im_peer_total: number
		backlog_pending: number
	}
	samples: {
		conversation: Array<ReportConversationSample>
		im: Array<ReportConversationSample>
	}
}

export interface ReportTopicSummary {
	overview: string
	themes: Array<string>
	learnings: Array<string>
	advice: Array<string>
	im_focus: Array<string>
}

export interface ReportStatus {
	running: boolean
	period: ReportPeriod | null
	key: string
	label: string
	stage: string
	detail: string
	progress: number
	error: string
	report_path: string
	plan_path: string
	updated_at: number
	last_completed_at: number
}

export interface ReportQueryResult {
	window: ReportWindow
	exists: boolean
	content: string
	path: string
	updated_at: number
	status: ReportStatus
}

export interface ReportRuntime {
	getStatus: () => Promise<ReportStatus>
	query: (args: { period: ReportPeriod; offset?: number }) => Promise<ReportQueryResult>
	runNow: (args: { period: ReportPeriod; offset?: number; force?: boolean }) => Promise<ReportStatus>
}

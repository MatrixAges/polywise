export interface Workspace {
	name: string
	endpoint?: string
}

export const default_fetch_fallback_chain = ['agent-browser', 'opencli', 'dokobot', 'crawl4ai', 'r.jina.ai'] as const

export type WebfetchFallbackProvider = (typeof default_fetch_fallback_chain)[number]

export interface DefaultModel {
	provider: string
	model: string
	effort?: string
}

export interface McpOAuthConfig {
	clientId?: string
	clientSecret?: string
	scope?: string
	redirectUri?: string
}

export interface McpLocalConfig {
	type: 'local'
	command: Array<string>
	environment?: Record<string, string>
	enabled?: boolean
	timeout?: number
}

export interface McpRemoteConfig {
	type: 'remote'
	url: string
	enabled?: boolean
	headers?: Record<string, string>
	oauth?: McpOAuthConfig | false
	timeout?: number
}

export interface McpEnabledConfig {
	enabled: boolean
}

export interface McpConfig {
	enabled?: boolean
	[name: string]: McpLocalConfig | McpRemoteConfig | boolean | undefined
}

export interface AppRewireConfig {
	enabled: boolean
	tick_ms?: number
	idle_grace_ms?: number
	replay_window_ms?: number
	max_groups_per_cycle?: number
	max_edge_creations_per_cycle?: number
	max_edge_prunes_per_cycle?: number
	hot_node_degree_limit?: number
	cold_node_degree_limit?: number
	monitor_ms?: number
}

export interface AppPthinkConfig {
	enabled: boolean
	idle_grace_ms?: number
	review_cooldown_ms?: number
	min_messages?: number
	max_messages?: number
	max_articles_per_run?: number
	skill_generation_enabled?: boolean
	tool_generation_enabled?: boolean
	daily_report_enabled?: boolean
	daily_report_hour?: number
	weekly_report_enabled?: boolean
	weekly_report_weekday?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
	weekly_report_hour?: number
	trigger_enabled?: boolean
	max_reports_per_day?: number
}

export interface AppReportConfig {
	enabled: boolean
}

export interface AppAuthConfig {
	enabled: boolean
}

export interface AppConfig {
	workspaces: Array<Workspace>
	current_workspace: string
	submit_mode: 'enter' | 'ctrl+enter'
	default_model: DefaultModel
	jina_api_key?: string
	bookmark_auto_clean?: boolean
	agent_export_dir?: string
	enbale_webfetch_chain: boolean
	fetch_fallback_chain: Array<WebfetchFallbackProvider>
	mcp?: McpConfig
	embedding_model?: DefaultModel
	rerank_model?: DefaultModel
	enable_triple: boolean
	triple_model?: DefaultModel
	enable_rewrite: boolean
	rewrite_model?: DefaultModel
	chaos_detect?: boolean
	rewire?: AppRewireConfig
	pthink?: AppPthinkConfig
	report?: AppReportConfig
	auth?: AppAuthConfig
}

export interface ProviderConfig {
	providers: Array<ConfigProvider>
	custom_providers?: Array<Provider>
}

export interface Provider {
	name: string
	apiKey: string
	baseURL: string
	enabled: boolean
	models: Array<Model>
	headers?: string
}

export interface Model {
	name: string
	id: string
	enabled: boolean
	type?: 'text' | 'embedding' | 'rerank' | 'image' | 'audio' | 'video'
	fid?: string
}

export interface PresetProvider extends Omit<Provider, 'baseURL'> {
	apiKey: string
	baseURL?: string
}

export interface SpecialProvider extends Partial<Omit<Provider, 'name' | 'enabled'>> {
	name: string
	enabled: boolean
	custom_fields?: Record<string, string>
}

export type ConfigProvider = PresetProvider | SpecialProvider

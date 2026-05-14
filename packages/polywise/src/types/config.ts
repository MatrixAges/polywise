export interface Workspace {
	name: string
	endpoint?: string
}

export const default_fetch_fallback_chain = ['agent-browser', 'opencli', 'curl.md', 'r.jina.ai'] as const

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

export interface AppConfig {
	workspaces: Array<Workspace>
	current_workspace: string
	submit_mode: 'enter' | 'ctrl+enter'
	default_model: DefaultModel
	jina_api_key?: string
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

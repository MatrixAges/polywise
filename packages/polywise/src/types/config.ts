export interface Workspace {
	name: string
	endpoint?: string
}

export interface DefaultModel {
	provider: string
	model: string
}

export interface AppConfig {
	workspaces: Array<Workspace>
	current_workspace: string
	submit_mode: 'enter' | 'ctrl+enter'
	default_model: DefaultModel
	enable_triple: boolean
	triple_model: DefaultModel
	enable_rewrite: boolean
	rewrite_model: DefaultModel
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

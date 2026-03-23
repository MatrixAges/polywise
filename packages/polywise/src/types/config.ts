export interface AppConfig {
	provider: {
		id: string
		model: string
		effort: string
	}
}

export interface ProviderConfig {
	providers: Array<ConfigProvider>
	custom_providers?: Array<Provider>
}

export interface Provider {
	name: string
	api_key: string
	base_url: string
	enabled: boolean
	models: Array<Model>
	headers?: string
}

export interface Model {
	name: string
	id: string
	enabled: boolean
	fid?: string
}

export interface PresetProvider extends Omit<Provider, 'base_url'> {
	api_key: string
	base_url?: string
}

export interface SpecialProvider extends Partial<Omit<Provider, 'name' | 'enabled'>> {
	name: string
	enabled: boolean
	custom_fields?: Record<string, string>
}

export type ConfigProvider = PresetProvider | SpecialProvider

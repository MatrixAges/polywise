import type { PresetProvider } from '@core/types'

export default {
	name: 'xiaomi_mimo',
	enabled: true,
	apiKey: '',
	baseURL: 'https://api.xiaomimimo.com/v1',
	models: [
		{
			enabled: true,
			id: 'mimo-v2.5-pro',
			name: 'Mimo V2.5 Pro'
		},
		{
			enabled: true,
			id: 'mimo-v2-pro',
			name: 'Mimo V2 Pro'
		}
	]
} as PresetProvider

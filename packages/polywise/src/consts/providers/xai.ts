import type { PresetProvider } from '@core/types'

export default {
	name: 'xai',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'grok-4-0709',
			name: 'Grok 4'
		},
		{
			enabled: true,
			id: 'grok-3',
			name: 'Grok 3'
		},
		{
			enabled: true,
			id: 'grok-3-fast',
			name: 'Grok 3 Fast'
		}
	]
} as PresetProvider

import type { PresetProvider } from '@core/types'

export default {
	name: 'cerebras',
	enabled: true,
	apiKey: '',
	models: [
		{
			enabled: true,
			id: 'llama4-scout',
			name: 'Llama 4 Scout'
		},
		{
			enabled: true,
			id: 'llama3.1-8b',
			name: 'Llama 3.1 8B'
		},
		{
			enabled: true,
			id: 'llama3.1-70b',
			name: 'Llama 3.1 70B'
		}
	]
} as PresetProvider

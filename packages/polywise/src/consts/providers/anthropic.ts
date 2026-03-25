import type { PresetProvider } from '@core/types'

export default {
	name: 'anthropic',
	enabled: true,
	apiKey: '',
	models: [
		{
			enabled: true,
			id: 'claude-opus-4-6',
			name: 'Claude Opus 4.6'
		},
		{
			enabled: true,
			id: 'claude-sonnet-4.6',
			name: 'Claude Sonnet 4.6'
		}
	]
} as PresetProvider

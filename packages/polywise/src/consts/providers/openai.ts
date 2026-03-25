import type { PresetProvider } from '@core/types'

export default {
	name: 'openai',
	enabled: true,
	apiKey: '',
	models: [
		{
			enabled: true,
			id: 'gpt-5.3-codex',
			name: 'GPT 5.3 Codex'
		},
		{
			enabled: true,
			id: 'gpt-5.3',
			name: 'GPT 5.3'
		}
	]
} as PresetProvider

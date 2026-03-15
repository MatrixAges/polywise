import type { PresetProvider } from '../types'

export default {
	name: 'openai',
	enabled: true,
	api_key: '',
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

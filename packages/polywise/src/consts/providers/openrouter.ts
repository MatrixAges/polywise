import type { PresetProvider } from '@core/types'

export default {
	name: 'openrouter',
	enabled: true,
	apiKey: '',
	models: [
		{
			enabled: true,
			id: 'deepseek/deepseek-r1-0528:free',
			name: 'Deepseek R1'
		},
		{
			enabled: true,
			id: 'deepseek/deepseek-chat-v3-0324:free',
			name: 'Deepseek V3'
		},
		{
			enabled: true,
			id: 'google/gemini-2.0-flash-exp:free',
			name: 'Gemini 2.0 Flash'
		},
		{
			enabled: true,
			id: 'qwen/qwen3-32b:free',
			name: 'Qwen3 32B'
		}
	]
} as PresetProvider

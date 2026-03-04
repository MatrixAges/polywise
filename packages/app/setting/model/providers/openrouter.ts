import type { PresetProvider } from '@/libs'

export default {
	name: 'openrouter',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'deepseek/deepseek-r1-0528:free',
			name: 'Deepseek R1',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true
			}
		},
		{
			enabled: true,
			id: 'deepseek/deepseek-chat-v3-0324:free',
			name: 'Deepseek V3',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'google/gemini-2.0-flash-exp:free',
			name: 'Gemini 2.0 Flash',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'qwen/qwen3-32b:free',
			name: 'Qwen3 32B',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

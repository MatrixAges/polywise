import type { PresetProvider } from '@/libs'

export default {
	name: 'deepseek',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'deepseek-reasoner',
			name: 'Deepseek R1',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true
			}
		},
		{
			enabled: true,
			id: 'deepseek-chat',
			name: 'Deepseek V3',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

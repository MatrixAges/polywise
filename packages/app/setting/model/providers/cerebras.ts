import type { PresetProvider } from '@/libs'

export default {
	name: 'cerebras',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'llama4-scout',
			name: 'Llama 4 Scout',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'llama3.1-8b',
			name: 'Llama 3.1 8B',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'llama3.1-70b',
			name: 'Llama 3.1 70B',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

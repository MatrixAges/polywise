import type { PresetProvider } from '@/libs'

export default {
	name: 'xai',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'grok-4-0709',
			name: 'Grok 4',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true
			}
		},
		{
			enabled: true,
			id: 'grok-3',
			name: 'Grok 3',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'grok-3-fast',
			name: 'Grok 3 Fast',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

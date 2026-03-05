import type { PresetProvider } from '../types'

export default {
	name: 'cohere',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'command-a-03-2025',
			name: 'Command A 032025',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'command-r7b-12-2024',
			name: 'Command R 7B',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'command-r-plus-04-2024',
			name: 'Command R Plus',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

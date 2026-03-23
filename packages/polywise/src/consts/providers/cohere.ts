import type { PresetProvider } from '@core/types'

export default {
	name: 'cohere',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'command-a-03-2025',
			name: 'Command A 032025'
		},
		{
			enabled: true,
			id: 'command-r7b-12-2024',
			name: 'Command R 7B'
		},
		{
			enabled: true,
			id: 'command-r-plus-04-2024',
			name: 'Command R Plus'
		}
	]
} as PresetProvider

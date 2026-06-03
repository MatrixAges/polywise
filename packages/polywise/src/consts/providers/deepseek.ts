import type { PresetProvider } from '@core/types'

export default {
	name: 'deepseek',
	enabled: true,
	apiKey: '',
	models: [
		{
			enabled: true,
			id: 'deepseek-v4-pro',
			name: 'Deepseek V4 Pro'
		},
		{
			enabled: true,
			id: 'deepseek-v4-flash',
			name: 'Deepseek V4 Flash'
		}
	]
} as PresetProvider

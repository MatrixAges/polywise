import type { PresetProvider } from '../types'

export default {
	name: 'deepseek',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'deepseek-reasoner',
			name: 'Deepseek R1'
		},
		{
			enabled: true,
			id: 'deepseek-chat',
			name: 'Deepseek Chat'
		}
	]
} as PresetProvider

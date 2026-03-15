import type { PresetProvider } from '../types'

export default {
	name: 'zhipu',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'glm-5',
			name: 'GLM 5'
		},
		{
			enabled: true,
			id: 'glm-5-flash',
			name: 'GLM 5 Flash'
		}
	]
} as PresetProvider

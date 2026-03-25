import type { PresetProvider } from '@core/types'

export default {
	name: 'zhipu',
	enabled: true,
	apiKey: '',
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

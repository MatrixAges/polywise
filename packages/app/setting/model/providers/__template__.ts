import type { PresetProvider } from '@/libs'

export default {
	name: '__template__',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: '',
			name: '',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

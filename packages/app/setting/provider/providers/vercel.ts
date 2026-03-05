import type { PresetProvider } from '../types'

export default {
	name: 'vercel',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'v0-1.5-md',
			name: 'V0 1.5 MD',
			features: {
				function_calling: true,
				structured_output: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'v0-1.5-lg',
			name: 'V0 1.5 LG',
			features: {
				function_calling: true,
				structured_output: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'v0-1.0-md',
			name: 'V0 1.0- MD',
			features: {
				function_calling: true,
				structured_output: true,
				image_input: true
			}
		}
	]
} as PresetProvider

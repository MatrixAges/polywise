import type { PresetProvider } from '../types'

export default {
	name: 'google_gemini',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'gemini-3.1-pro-preview',
			name: 'Gemini 3.1 Pro'
		},
		{
			enabled: true,
			id: 'gemini-3-flash-preview',
			name: 'Gemini 3 Flash'
		}
	]
} as PresetProvider

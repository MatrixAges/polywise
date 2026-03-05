import type { PresetProvider } from '../types'

export default {
	name: 'google_gemini',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'gemini-2.5-pro',
			name: 'Gemini 2.5 Pro',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'gemini-2.5-flash',
			name: 'Gemini 2.5 Flash',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'gemini-1.5-pro',
			name: 'Gemini 1.5 Pro',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'gemini-1.5-flash',
			name: 'Gemini 1.5 Flash',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true
			}
		}
	]
} as PresetProvider

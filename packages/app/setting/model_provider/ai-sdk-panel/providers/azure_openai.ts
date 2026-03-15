import type { SpecialProvider } from '../types'

export default {
	name: 'azure_openai',
	enabled: true,
	api_key: '',
	custom_fields: {
		api_version: '2024-10-01-preview',
		resourceName: ''
	},
	models: [
		{
			enabled: true,
			id: 'gpt-4.1',
			name: 'GPT 4.1'
		},
		{
			enabled: true,
			id: 'gpt-4o',
			name: 'GPT 4o'
		},
		{
			enabled: true,
			id: 'gpt-3.5-turbo',
			name: 'GPT 3.5 Turbo'
		}
	]
} as SpecialProvider

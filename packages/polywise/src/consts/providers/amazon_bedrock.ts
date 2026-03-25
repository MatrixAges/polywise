import type { SpecialProvider } from '@core/types'

export default {
	name: 'amazon_bedrock',
	enabled: true,
	apiKey: '',
	custom_fields: { region: 'us-east-1', accessKeyId: '', secretAccessKey: '', sessionToken: '' },
	models: [
		{
			enabled: true,
			id: 'amazon.nova-pro-v1:0',
			name: 'Amazon Nova Pro'
		},
		{
			enabled: true,
			id: 'amazon.nova-lite-v1:0',
			name: 'Amazon Nova Lite'
		},
		{
			enabled: true,
			id: 'anthropic.claude-3-opus-20240229-v1:0',
			name: 'Claude 3 Opus'
		},
		{
			enabled: true,
			id: 'anthropic.claude-3-sonnet-20240229-v1:0',
			name: 'Claude 3 Sonnet'
		},
		{
			enabled: true,
			id: 'anthropic.claude-3-haiku-20240307-v1:0',
			name: 'Claude 3 Haiku'
		},
		{
			enabled: true,
			id: 'cohere.command-r-v1:0',
			name: 'Command R'
		},
		{
			enabled: true,
			id: 'cohere.command-r-plus-v1:0',
			name: 'Command R Plus'
		},
		{
			enabled: true,
			id: 'meta.llama3-8b-instruct-v1:0',
			name: 'Llama 3 8B Instruct'
		},
		{
			enabled: true,
			id: 'meta.llama3-70b-instruct-v1:0',
			name: 'Llama 3 70B Instruct'
		}
	]
} as SpecialProvider

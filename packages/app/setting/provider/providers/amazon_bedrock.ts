import type { SpecialProvider } from '../types'

export default {
	name: 'amazon_bedrock',
	enabled: true,
	api_key: '',
	custom_fields: { region: 'us-east-1', accessKeyId: '', secretAccessKey: '', sessionToken: '' },
	models: [
		{
			enabled: true,
			id: 'amazon.nova-pro-v1:0',
			name: 'Amazon Nova Pro',
			features: {
				function_calling: true,
				structured_output: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'amazon.nova-lite-v1:0',
			name: 'Amazon Nova Lite',
			features: {
				function_calling: true,
				structured_output: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'anthropic.claude-3-opus-20240229-v1:0',
			name: 'Claude 3 Opus',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'anthropic.claude-3-sonnet-20240229-v1:0',
			name: 'Claude 3 Sonnet',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'anthropic.claude-3-haiku-20240307-v1:0',
			name: 'Claude 3 Haiku',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'cohere.command-r-v1:0',
			name: 'Command R',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'cohere.command-r-plus-v1:0',
			name: 'Command R Plus',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'meta.llama3-8b-instruct-v1:0',
			name: 'Llama 3 8B Instruct',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'meta.llama3-70b-instruct-v1:0',
			name: 'Llama 3 70B Instruct',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as SpecialProvider

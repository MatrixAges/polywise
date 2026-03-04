import type { PresetProvider } from '@/libs'

export default {
	name: 'anthropic',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'claude-sonnet-4-5',
			name: 'Claude Sonnet 4.5',
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
			id: 'claude-sonnet-4',
			name: 'Claude Sonnet 4',
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
			id: 'claude-sonnet-3-7',
			name: 'Claude Sonnet 3.7',
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
			id: 'claude-opus-4-1',
			name: 'Claude Opus 4.1',
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
			id: 'claude-opus-4-0',
			name: 'Claude Opus 4.0',
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
			id: 'claude-3-5-haiku',
			name: 'Claude Haiku 3.5',
			features: {
				function_calling: true,
				structured_output: true,
				reasoning: true,
				reasoning_optional: true,
				web_search: true,
				image_input: true
			}
		}
	]
} as PresetProvider

import type { PresetProvider } from '@/libs'

export default {
	name: 'openai',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'gpt-5',
			name: 'GPT 5',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				image_input: true,
				reasoning: true,
				reasoning_optional: true
			}
		},
		{
			enabled: true,
			id: 'gpt-5-mini',
			name: 'GPT 5 Mini',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				image_input: true,
				reasoning: true,
				reasoning_optional: true
			}
		},
		{
			enabled: true,
			id: 'gpt-5-nano',
			name: 'GPT 5 Nano',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				image_input: true,
				reasoning: true,
				reasoning_optional: true
			}
		},
		{
			enabled: true,
			id: 'gpt-4.1',
			name: 'GPT 4.1',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'gpt-4.1-mini',
			name: 'GPT 4.1 Mini',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'gpt-4o',
			name: 'GPT 4o',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'gpt-4o-mini',
			name: 'GPT 4o Mini',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'o4-mini',
			name: 'o4 Mini',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				reasoning: true
			}
		},
		{
			enabled: true,
			id: 'o3',
			name: 'o3',
			features: {
				function_calling: true,
				structured_output: true,
				web_search: true,
				reasoning: true
			}
		}
	]
} as PresetProvider

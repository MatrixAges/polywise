import type { PresetProvider } from '@/libs'

export default {
	name: 'mistral',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'pixtral-large-latest',
			name: 'Pixtral Large (latest)',
			features: {
				function_calling: true,
				structured_output: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'pixtral-12b-2409',
			name: 'Pixtral 12B 2409',
			features: {
				function_calling: true,
				structured_output: true,
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'mistral-large-latest',
			name: 'Mistral Large (latest)',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'mistral-medium-latest',
			name: 'Mistral Medium (latest)',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'mistral-small-latest',
			name: 'Mistral Small (latest)',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'mistral-tiny-latest',
			name: 'Mistral Tiny (latest)',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

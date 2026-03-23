import type { PresetProvider } from '@core/types'

export default {
	name: 'mistral',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'pixtral-large-latest',
			name: 'Pixtral Large (latest)'
		},
		{
			enabled: true,
			id: 'pixtral-12b-2409',
			name: 'Pixtral 12B 2409'
		},
		{
			enabled: true,
			id: 'mistral-large-latest',
			name: 'Mistral Large (latest)'
		},
		{
			enabled: true,
			id: 'mistral-medium-latest',
			name: 'Mistral Medium (latest)'
		},
		{
			enabled: true,
			id: 'mistral-small-latest',
			name: 'Mistral Small (latest)'
		},
		{
			enabled: true,
			id: 'mistral-tiny-latest',
			name: 'Mistral Tiny (latest)'
		}
	]
} as PresetProvider

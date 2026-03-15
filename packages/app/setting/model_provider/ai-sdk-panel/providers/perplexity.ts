import type { PresetProvider } from '../types'

export default {
	name: 'perplexity',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'sonar',
			name: 'Sonar'
		},
		{
			enabled: true,
			id: 'sonar-pro',
			name: 'Sonar Pro'
		},
		{
			enabled: true,
			id: 'sonar-reasoning',
			name: 'Sonar Reasoning'
		},
		{
			enabled: true,
			id: 'sonar-small-online',
			name: 'Sonar Small Online'
		},
		{
			enabled: true,
			id: 'sonar-medium-online',
			name: 'Sonar Medium Online'
		},
		{
			enabled: true,
			id: 'sonar-large-online',
			name: 'Sonar Large Online'
		}
	]
} as PresetProvider

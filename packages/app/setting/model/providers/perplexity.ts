import type { PresetProvider } from '@/libs'

export default {
	name: 'perplexity',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'sonar',
			name: 'Sonar',
			features: {
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'sonar-pro',
			name: 'Sonar Pro',
			features: {
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'sonar-reasoning',
			name: 'Sonar Reasoning',
			features: {
				web_search: true,
				reasoning: true
			}
		},
		{
			enabled: true,
			id: 'sonar-small-online',
			name: 'Sonar Small Online',
			features: {
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'sonar-medium-online',
			name: 'Sonar Medium Online',
			features: {
				web_search: true
			}
		},
		{
			enabled: true,
			id: 'sonar-large-online',
			name: 'Sonar Large Online',
			features: {
				web_search: true
			}
		}
	]
} as PresetProvider

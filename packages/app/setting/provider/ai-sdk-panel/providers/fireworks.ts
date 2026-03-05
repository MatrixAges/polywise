import type { PresetProvider } from '../types'

export default {
	name: 'fireworks',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'accounts/fireworks/models/deepseek-r1',
			name: 'Deepseek R1'
		},
		{
			enabled: true,
			id: 'accounts/fireworks/models/deepseek-v3',
			name: 'Deepseek V3'
		},
		{
			enabled: true,
			id: 'accounts/fireworks/models/llama-3.1-8b-instruct',
			name: 'Llama 3.1 8B Instruct'
		},
		{
			enabled: true,
			id: 'accounts/fireworks/models/llama-3.1-70b-instruct',
			name: 'Llama 3.1 70B Instruct'
		},
		{
			enabled: true,
			id: 'accounts/fireworks/models/mixtral-8x22b-instruct',
			name: 'Mixtral 22B Instruct'
		},
		{
			enabled: true,
			id: 'accounts/fireworks/models/mistral-7b-instruct',
			name: 'Mistral 7B Instruct'
		}
	]
} as PresetProvider

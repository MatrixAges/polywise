import type { PresetProvider } from '../types'

export default {
	name: 'together',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
			name: 'Mixtral 22B Instruct'
		},
		{
			enabled: true,
			id: 'mistralai/Mistral-7B-Instruct-v0.3',
			name: 'Mistral 7B Instruct'
		},
		{
			enabled: true,
			id: 'meta-llama/Llama-3.1-8B-Instruct',
			name: 'Llama 3.1 8B Instruct'
		},
		{
			enabled: true,
			id: 'meta-llama/Llama-3.1-70B-Instruct',
			name: 'Llama 3.1 70B Instruct'
		},
		{
			enabled: true,
			id: 'deepseek-ai/deepseek-r1-0528-qwen3-8b',
			name: 'Deepseek R1 Qwen3 8B'
		},
		{
			enabled: true,
			id: 'deepseek-ai/deepseek-v3-chat',
			name: 'Deepseek V3 Chat'
		}
	]
} as PresetProvider

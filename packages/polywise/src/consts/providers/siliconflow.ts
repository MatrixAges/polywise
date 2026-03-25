import type { PresetProvider } from '@core/types'

export default {
	name: 'siliconflow',
	enabled: true,
	apiKey: '',
	baseURL: '',
	models: [
		{
			enabled: true,
			id: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
			name: 'Qwen3 8B Distill (DeepSeek R1 0528)'
		},
		{
			enabled: true,
			id: 'deepseek-ai/DeepSeek-V3-Chat',
			name: 'DeepSeek V3 Chat'
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
			id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
			name: 'Mixtral 22B Instruct'
		},
		{
			enabled: true,
			id: 'mistralai/Mistral-7B-Instruct-v0.3',
			name: 'Mistral 7B Instruct'
		}
	]
} as PresetProvider

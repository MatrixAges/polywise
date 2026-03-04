import type { PresetProvider } from '@/libs'

export default {
	name: 'deepinfra',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
			name: 'Llama 4 Maverick',
			features: {
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
			name: 'Llama 4 Scout',
			features: {
				image_input: true
			}
		},
		{
			enabled: true,
			id: 'meta-llama/Llama-3.1-8B-Instruct',
			name: 'Llama 3.1 8B Instruct',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'meta-llama/Llama-3.1-70B-Instruct',
			name: 'Llama 3.1 70B Instruct',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
			name: 'Mixtral 22B Instruct',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'mistralai/Mistral-7B-Instruct-v0.3',
			name: 'Mistral 7B Instruct',
			features: {
				function_calling: true,
				structured_output: true
			}
		},
		{
			enabled: true,
			id: 'deepseek-ai/deepseek-r1-0528-qwen3-8b',
			name: 'Deepseek R1 Qwen3 8B',
			features: {
				reasoning: true
			}
		},
		{
			enabled: true,
			id: 'deepseek-ai/deepseek-v3-chat',
			name: 'Deepseek V3 Chat',
			features: {
				function_calling: true,
				structured_output: true
			}
		}
	]
} as PresetProvider

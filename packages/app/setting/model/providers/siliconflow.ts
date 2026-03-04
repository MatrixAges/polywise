import type { PresetProvider } from '@/libs'

export default {
	name: 'siliconflow',
	enabled: true,
	api_key: '',
	base_url: '',
	models: [
		{
			enabled: true,
			id: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
			name: 'Qwen3 8B Distill (DeepSeek R1 0528)',
			features: {
				reasoning: true
			}
		},
		{
			enabled: true,
			id: 'deepseek-ai/DeepSeek-V3-Chat',
			name: 'DeepSeek V3 Chat',
			features: {
				function_calling: true,
				structured_output: true
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
		}
	]
} as PresetProvider

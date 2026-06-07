export default {
	providers: {
		openai: 'OpenAI',
		anthropic: 'Anthropic',
		google_gemini: 'Google',
		xai: 'Grok',
		deepseek: 'Deepseek',
		openrouter: 'OpenRouter',
		ollama: 'Ollama',
		cerebras: 'Cerebras',
		cohere: 'Cohere',
		deepinfra: 'Deepinfra',
		fireworks: 'Firworks',
		groq: 'Groq',
		lmstudio: 'LMStudio',
		mistral: 'Mistral',
		perplexity: 'Perplexity',
		siliconflow: 'SiliconFlow',
		together: 'Together',
		vercel: 'Vercel',
		zhipu: 'Zhipu',
		aliyun_bailian: 'Aliyun',
		tencent_hunyuan: 'Tencent',
		volcengine: 'Bytedance',
		azure_openai: 'Azure',
		amazon_bedrock: 'Amazon',
		minimax: 'MiniMax',
		moonshot: 'Moonshot',
		xiaomi_mimo: 'Xiaomi',
		jina: 'Jina',
		custom: 'Custom',
		disabled: 'Disabled'
	},
	upload: {
		validate_error_prefix: '[Validate error]: ',
		upload_error: '[Upload error]: please check config format.',
		import_error_title: 'Import Error',
		import_error_desc: 'The fields in the imported configuration do not match. {{error}}'
	},
	form: {
		apiKey: 'API Key',
		baseURL: 'Base URL',
		models: 'Models',
		actions: 'Actions',
		add_model: 'Add Model',
		reset_model: 'Reset Model',
		export_config: 'Export Config',
		import_config: 'Import Config',
		disable_provider: 'Disable Provider',
		cancel: 'Cancel',
		submit: 'Submit',
		models_empty: 'No models added',
		error: {
			id_required: 'Model ID is required',
			id_exsit: 'Model ID is exist',
			name_required: 'Model name is required'
		},
		model_form: {
			input: 'Input ',
			model_id: 'model ID',
			model_name: 'model name',
			model_type: 'model type',
			select_type: 'Select type',
			output_fee: 'output fee',
			input_fee: 'input fee',
			per_million: ' (per million)',
			model_desc: 'model desc'
		},
		custom: {
			add_provider: 'Add Provider',
			openai_compatible: 'OpenAI Compatible Provider',
			providers: 'Providers',
			provider_name: 'Provider Name',
			headers: 'Headers (optional)',
			headers_placeholder: '{"x-custom-header":"value"}',
			error: 'Provider {{name}} has exist'
		},
		disabled: {
			disabled_provider: 'Disabled Providers',
			empty: 'No providers disabled'
		}
	},
	coding_plan: {
		title: 'Coding Plan',
		per_month: '/Month',
		open_code_go: {
			name: 'OpenCode Go',
			desc: 'Use strong leading open-source AI models through stable, high-quota access at lower cost for developers worldwide.',
			comment: 'Cheapest, most stable, and most popular.'
		},
		xiaomi_mimo: {
			name: 'Xiaomi Mimo Coding Plan'
		},
		minimax: {
			name: 'MiniMax Coding Plan'
		},
		bytedance_ark: {
			name: 'Bytedance Ark Coding Plan'
		},
		aliyun_bailian: {
			name: 'Aliyun Bailian Coding Plan'
		}
	}
}

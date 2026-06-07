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
		validate_error_prefix: '[校验错误]：',
		upload_error: '[上传错误]：请检查配置格式。'
	},
	form: {
		apiKey: 'API Key',
		baseURL: 'Base URL',
		models: '模型',
		actions: '操作',
		add_model: '添加模型',
		reset_model: '重置模型',
		export_config: '导出配置',
		import_config: '导入配置',
		disable_provider: '禁用提供方',
		cancel: '取消',
		submit: '提交',
		models_empty: '还没有添加模型',
		error: {
			id_required: '模型 ID 不能为空',
			id_exsit: '模型 ID 已存在',
			name_required: '模型名称不能为空'
		},
		model_form: {
			input: '请输入',
			model_id: '模型 ID',
			model_name: '模型名称',
			model_type: '模型类型',
			select_type: '选择类型',
			output_fee: '输出费用',
			input_fee: '输入费用',
			per_million: '（每百万）',
			model_desc: '模型描述'
		},
		custom: {
			add_provider: '添加提供方',
			openai_compatible: '兼容 OpenAI 的提供方',
			providers: '提供方',
			provider_name: '提供方名称',
			headers: '请求头（可选）',
			headers_placeholder: '{"x-custom-header":"value"}',
			error: '提供方 {{name}} 已存在'
		},
		disabled: {
			disabled_provider: '已禁用的提供方',
			empty: '没有已禁用的提供方'
		}
	},
	coding_plan: {
		title: '编码套餐'
	}
}

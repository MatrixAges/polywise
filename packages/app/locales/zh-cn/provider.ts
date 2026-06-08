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
		fireworks: 'Fireworks',
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
		upload_error: '[上传错误]：请检查配置格式。',
		import_error_title: '导入错误',
		import_error_desc: '导入配置中的字段不匹配。{{error}}'
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
		title: '编程套餐',
		per_month: '/月',
		open_code_go: {
			name: 'OpenCode Go',
			desc: '通过稳定、高额度地接入强大的领先开源 AI 模型，以更低成本为全球开发者提供智能编码能力。',
			comment: '最便宜、最稳定，也最流行。'
		},
		xiaomi_mimo: {
			name: '小米 Mimo Coding Plan'
		},
		minimax: {
			name: 'MiniMax Coding Plan'
		},
		bytedance_ark: {
			name: '字节跳动 Ark Coding Plan'
		},
		aliyun_bailian: {
			name: '阿里云百炼 Coding Plan'
		}
	}
}

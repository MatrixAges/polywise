export default {
	system_prompt: {
		title: '系统提示词',
		desc: '输入系统提示词，指定角色和功能'
	},
	placeholder: '我可以帮您做什么？',
	prompt_rewriting: '提示词优化',
	use_preset: '使用模型预设',
	newline_by_enter: '回车键换行',
	web_search: '网页搜索',
	builtin_search: '模型内置搜索',
	temperature: {
		title: '温度',
		desc: '控制返回文本的随机性，较低的值减少随机性'
	},
	top_p: {
		title: '累积概率',
		desc: '返回的最有可能的令牌的累积概率'
	},
	max_ouput_tokens: {
		title: '最大令牌数',
		desc: '返回的最大令牌数，设置为0禁用'
	}
}

export default {
	providers: {
		title: '模型提供商',
		links: {
			website: '网站',
			doc: '文档',
			model_spec: '模型',
			api_key: '获取密钥'
		},
		api_base_url: 'API 地址',
		api_base_url_placeholder: '输入模型服务商提供的 API 地址',
		api_key: 'API 密钥',
		api_key_placeholder: '使用前请先获取并输入 API 密钥',
		model_form: {
			id: '序列号',
			name: '名称',
			fee: {
				title: '费用',
				input: '输入价格',
				output: '输出价格'
			},
			features: '特性'
		},
		features: {
			function_calling: '函数调用',
			structured_output: '结构化输出',
			reasoning: '推理',
			reasoning_optional: '可选推理',
			web_search: '网络搜索',
			image_input: '图像输入',
			image_output: '图像输出',
			embedding: '嵌入',
			reranking: '重排序'
		},
		add_provider_modal: {
			provider_name: '供应商名称',
			link_to: '链接跳转到'
		},
		provider_exsit: '提供商名称已存在，请修改名称',
		model_exist: '该分组存在相同 ID 的模型，请修改模型 ID 后再保存'
	},
	preset: {
		title: '预设',
		config: {
			title: '配置'
		},
		prompt: {
			title: '提示词'
		}
	},
	general: {
		title: '通用设置',
		normal: {
			title: '偏好设置',
			language: {
				title: '语言',
				desc: '应用所使用的语言'
			},
			theme: {
				title: '主题',
				desc: '应用主题色、组件颜色',
				options: {
					light: '浅色',
					dark: '深色',
					system: '跟随系统'
				},
				auto_theme: '自动切换主题，6点到18点浅色主题，其余时间深色主题'
			},
			cache: {
				title: '应用缓存',
				clear: '清除缓存',
				desc: `清除应用缓存的设置项`
			}
		},
		update: {
			title: '版本更新',
			subtitle: '更新',
			desc: '当前版本',
			btn_update: '检查更新',
			btn_download: '下载更新',
			no_update: '当前使用的IF是最新版本',
			has_update: '检测到新版本',
			downloading: '正在下载新版本',
			downloaded: '已下载更新内容，重启安装更新',
			btn_install: '安装更新',
			install_backup: '更新前请进行备份'
		}
	},
	shortcuts: {
		title: '快捷键',
		'app.toggleSetting': '切换设置面板',
		'app.toggleSidebar': '切换侧边栏',
		'app.openSearch': '唤起搜索面板',
		'app.closeSearch': '关闭搜索面板',
		keydown: '按下键',
		keyup: '松开键'
	},
	about: {
		title: '关于我们',
		media: {
			website: '官方网站',
			github: '代码仓库',
			license: '许可证'
		},
		words: '灵魂在学会认识自己时变得智慧',
		person: '毕达哥拉斯'
	},
	note: {
		toc: {
			title: '展示内容大纲',
			desc: '大纲用于总览文章结构'
		},
		show_heading_text: {
			title: '展示标题级别',
			desc: '在标题的左侧展示标题的级别'
		},
		serif: {
			title: '衬线字体',
			desc: '衬线字体有易读、专业、可识别等优点'
		},
		small_text: {
			title: '小字号',
			desc: '更好的字号以展示更多内容'
		},
		count: {
			title: '字数统计',
			desc: '统计全文字数，不包含空格'
		}
	}
}

export default {
	session: {
		empty_title: '新的开始',
		sources: '来源',
		edit_file_tool: '编辑文件',
		no_changes: '没有变更',
		drawer: {
			title: '会话上下文',
			desc: '当前会话状态与环境'
		},
		input: {
			placeholder: '需要处理什么？',
			effort: '思考强度',
			mode: '模式',
			audit_mode: '审计模式',
			submit_mode: '提交模式',
			submit_enter: '回车模式',
			submit_ctrl_enter: 'Ctrl+回车模式',
			mode_normal: '普通',
			mode_plan: '计划',
			mode_plan_exec: '计划执行',
			audit_limited: '受限',
			audit_auto: '自动',
			audit_full: '完全访问',
			effort_default: '默认',
			effort_low: '低',
			effort_medium: '中',
			effort_high: '高',
			effort_xhigh: '超高',
			clear: '清空',
			unarchive: '恢复归档',
			context: '上下文',
			scroll_to_bottom: '滚动到底部',
			archive: '归档'
		},
		mention: {
			tools_mcps_skills: '工具、MCP 与技能',
			mentions: '提及项',
			type_to_search: '输入开始搜索',
			loading: '加载中...',
			no_matches: '未找到匹配项。',
			agent: '智能体',
			no_description: '暂无描述',
			tool: '工具',
			remote_mcp: '远程 MCP',
			local_mcp: '本地 MCP'
		},
		skill: {
			system: '系统',
			personal: '个人',
			creator_label: 'skill-creator',
			creator_desc: '根据重复工作流或失败模式创建或更新可复用的本地技能。',
			installer_label: 'skill-installer',
			installer_desc: '把精选技能或其他仓库中的技能安装到本地技能目录。'
		},
		permission: {
			title: '权限请求',
			tool: '工具',
			action: '操作',
			path: '路径',
			deny: '拒绝',
			allow: '允许'
		},
		alerts: {
			clear_title: '清空消息',
			clear_desc: '确认清空全部消息历史吗？',
			delete_title: '删除消息',
			delete_desc: '确认删除这条消息吗？',
			archive_title: '归档会话消息',
			archive_desc: '确认归档当前上下文和已加载的消息吗？'
		},
		question: {
			label: '问题',
			multiple: '多选',
			placeholder: '输入你的回答...',
			submit: '提交'
		},
		codex_exec: {
			pending: '待处理',
			running: '执行中',
			completed: '已完成',
			denied: '已拒绝',
			error: '异常'
		},
		context: {
			intent: '意图',
			context: '上下文',
			tasks: '任务',
			files: '文件',
			constraints: '约束',
			learned: '已学习',
			blockers: '阻塞项'
		},
		message: {
			delete_message: '删除消息',
			saved: '已保存',
			saving_wiki: '正在保存 Wiki 词条',
			save_wiki_article: '保存为 Wiki 词条',
			failed_save_wiki: '保存 Wiki 词条失败。',
			copied: '已复制',
			copy_message: '复制消息',
			worked_for: '处理耗时 {{duration}}',
			used_tools: '使用了工具',
			explored: '探索了 {{items}}',
			ran: '执行了 {{items}}',
			made: '产生了 {{items}}',
			used: '使用了 {{items}}',
			file_one: '{{count}} 个文件',
			file_other: '{{count}} 个文件',
			search_one: '{{count}} 次搜索',
			search_other: '{{count}} 次搜索',
			list_one: '{{count}} 个列表',
			list_other: '{{count}} 个列表',
			fetch_one: '{{count}} 次抓取',
			fetch_other: '{{count}} 次抓取',
			command_one: '{{count}} 个命令',
			command_other: '{{count}} 个命令',
			edit_one: '{{count}} 处编辑',
			edit_other: '{{count}} 处编辑',
			tool_one: '{{count}} 个工具',
			tool_other: '{{count}} 个工具'
		}
	}
} as const

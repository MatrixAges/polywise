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
			clear: '清空',
			unarchive: '恢复归档',
			context: '上下文',
			scroll_to_bottom: '滚动到底部',
			archive: '归档'
		},
		mention: {
			type_to_search: '输入开始搜索',
			loading: '加载中...',
			no_matches: '未找到匹配项。',
			agent: '智能体',
			no_description: '暂无描述',
			tool: '工具',
			remote_mcp: '远程 MCP',
			local_mcp: '本地 MCP'
		},
		permission: {
			title: '权限请求',
			tool: '工具',
			action: '操作',
			path: '路径',
			deny: '拒绝',
			allow: '允许'
		},
		question: {
			label: '问题',
			multiple: '多选',
			placeholder: '输入你的回答...',
			submit: '提交'
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

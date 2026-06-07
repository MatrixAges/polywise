export default {
	tabs: {
		stats: '统计',
		agent: '智能体',
		memory: '记忆',
		report: '报告'
	},
	period: {
		title: {
			day: '今天',
			week: '本周',
			month: '最近 30 天',
			year: '最近 365 天',
			total: '全部时间'
		}
	},
	sections: {
		trending: '趋势',
		report: '报告',
		memory: '记忆',
		agent: '智能体概览',
		activity_surface: '活动面',
		top_agents: '头部智能体',
		top_groups: '头部群组',
		pipeline_ready: '待处理队列',
		token_usage: 'Token 使用',
		content_review: '内容回顾'
	},
	common: {
		tokens: 'tokens',
		no_data: '当前时间窗口内没有数据。',
		total: '总计',
		documents: '文档',
		articles: '文章',
		links: '链接',
		posts: '帖子',
		top_models: '头部模型',
		providers: '提供方',
		less: '低',
		more: '高',
		activities_summary: '{{summary}} 内共有 {{count}} 次活动'
	},
	memory: {
		desc: '展示后台记忆系统中的图谱规模、重连压力以及相邻的运行信号。',
		nodes: '节点',
		edges: '边',
		frozen: '冻结',
		total: '总计',
		frozen_graph: '冻结图谱',
		nodes_and_edges_combined: '节点与边合计',
		ops_surface: '运行面'
	},
	trending: {
		token_throughput: 'Token 吞吐',
		workspace_activity: '工作区活动'
	},
	report: {
		runtime_status: '运行状态',
		updated: '更新时间 {{value}}',
		loading: '正在加载报告内容...',
		empty: '当前时间窗口还没有生成报告。可以使用顶部的“Report”按钮在后台生成。'
	}
} as const

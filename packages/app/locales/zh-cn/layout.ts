export default {
	nav: {
		home: '首页',
		session: '会话',
		agent: '智能体',
		linkcase: '链接库',
		post: '文章'
	},
	header: {
		status: '状态',
		workspaces: '工作区'
	},
	panel: {
		session: '会话',
		bookmark: '书签',
		pipeline: '队列',
		notification: '通知',
		actions: '操作',
		reset: '重置',
		collapse: '收起',
		loading_pipeline: '正在加载队列任务...',
		empty_pipeline: '暂无最近队列任务。',
		running: '运行中',
		queued: '排队中',
		recent: '最近',
		cancel: '取消',
		cancelling: '取消中...',
		retry: '重试',
		retrying: '重试中...',
		loading_notifications: '正在加载通知...',
		empty_notifications: '暂无通知。'
	},
	sessions_status: {
		title: '活跃会话',
		desc: '用于快速查看动态会话变化的面板',
		unread: '未读',
		running: '运行中',
		error: '异常',
		empty: '暂无会话',
		not_selected: '尚未选择会话'
	}
} as const

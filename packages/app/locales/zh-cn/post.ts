export default {
	tab: {
		wiki: '百科',
		memory: '记忆',
		user: '个人',
		linkcase: '链接库',
		agent: '智能体',
		outline: '大纲',
		related: '关联',
		project: '项目'
	},
	list: {
		search_articles: '搜索文章',
		close_search: '关闭搜索',
		search_posts: '搜索文章列表',
		new_post: '新建文章',
		no_posts: '还没有文章。',
		untitled_post: '未命名文章',
		empty_content: '暂无内容',
		related: '{{count}} 个关联',
		load_more: '加载更多',
		extract: '提取',
		reextract: '重新提取',
		remove: '删除'
	},
	detail: {
		untitled_post: '未命名文章',
		toggle_session_panel: '切换会话面板',
		updated: '更新于 {{value}}',
		unsaved_changes: '有未保存修改',
		saved: '已保存',
		characters: '{{count}} 个字符',
		loading_post: '正在加载文章',
		loading_post_detail: '正在加载文章...',
		select_post: '请从列表中选择一篇文章。',
		not_found: '未找到文章。',
		back_to_posts: '返回文章列表',
		add_reference: '添加引用',
		search_related: '搜索要关联的文章',
		searching: '搜索中...',
		no_matches: '没有匹配结果。',
		loading_related: '正在加载关联文章...',
		no_related: '还没有关联文章。',
		no_headings: '还没有 Markdown 标题。',
		no_related_projects: '还没有关联项目。',
		no_available_projects: '没有可用项目。',
		add: '添加',
		close: '关闭',
		create_session: '创建会话',
		related_project_hint: '关联项目文件会作为这篇文章的一手检索结果参与搜索。',
		loading_related_projects: '正在加载关联项目...',
		add_related_project: '添加关联项目',
		add_related_project_desc: '选择一个或多个项目，这些项目的文件会作为这篇文章的一手搜索输入。',
		search_projects: '搜索项目',
		loading_projects: '正在加载项目...',
		create_session_desc: '为 AI 辅助写作创建一个专用文章会话。'
	},
	toast: {
		saved: '文章已保存。',
		post_removed: '文章已删除。',
		extract_queued: '已加入提取队列。',
		extract_completed: '提取完成。'
	},
	confirm: {
		delete_post: '确认删除文章“{{title}}”？'
	}
} as const

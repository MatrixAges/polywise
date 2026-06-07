export default {
	detail: {
		prompt: '智能体如何运行',
		soul: '智能体在想什么',
		identity: '智能体是谁',
		memory: '核心记忆',
		select_agent: '选择一个智能体',
		remove_title: '删除智能体',
		remove_desc: '确认删除这个智能体吗？',
		frozen: '冻结',
		locked: '锁定',
		writable: '可编辑',
		exporting: '导出中...',
		export: '导出'
	},
	skills: {
		placeholder: '搜索并为智能体选择技能',
		empty: '没有找到技能。',
		log_empty: '该日期没有技能调用日志。'
	},
	info: {
		role_placeholder: '智能体角色',
		description_placeholder: '为这个智能体添加一句简短描述'
	},
	create: {
		auto: '自动',
		input: '输入',
		title: '创建智能体',
		auto_desc: '用一句话描述这个智能体的用途。系统会基于这句话生成它的角色、prompt、soul、identity 和 memory。',
		input_desc: '手动输入智能体的基础信息。这里只设置名称、角色和描述，其余字段保持为空。',
		purpose_placeholder: '例如：把复杂产品需求拆成清晰的执行计划',
		role_hint: '角色会自动生成，并限制在 20 个字符内。',
		name_placeholder: '智能体名称',
		role_placeholder: '角色，例如：产品负责人',
		role_desc: '必填。请控制在 20 个字符内，推荐不超过两个词。',
		description_placeholder: '简短描述',
		cancel: '取消',
		create: '创建',
		creating: '创建中...'
	},
	content: {
		loading_articles: '正在加载文章...',
		empty_manageable: '还没有私有文章。',
		empty_readonly: '没有私有文章。',
		untitled_article: '未命名文章',
		load_more: '加载更多',
		loading: '加载中...',
		private: '私有',
		related: '关联'
	},
	related_articles: {
		title: '关联文章',
		search_placeholder: '搜索要关联的文章',
		searching: '搜索中...',
		no_matches: '没有匹配结果。',
		untitled_article: '未命名文章',
		empty_content: '暂无内容',
		relate: '关联',
		loading: '正在加载关联文章...',
		empty: '还没有关联文章。',
		load_more: '加载更多',
		close: '关闭'
	},
	import: {
		title: '导入智能体',
		choose_dir: '选择目录路径',
		fetch: '获取',
		select_file: '从文件树中选择一个 .papk 文件',
		supported: '仅支持导入从 Agent Export 导出的 `.papk` 文件。',
		cancel: '取消',
		importing: '导入中...',
		import: '导入'
	},
	private_article: {
		title: '新建文章',
		untitled: '未命名文章',
		characters: '{{count}} 个字符',
		cancel: '取消',
		creating: '创建中...',
		create: '创建'
	},
	tools: {
		placeholder: '搜索并为智能体选择自定义工具',
		empty: '没有找到工具。',
		log_empty: '该日期没有工具调用日志。'
	}
} as const

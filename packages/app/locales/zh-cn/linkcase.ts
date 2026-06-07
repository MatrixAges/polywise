export default {
	dialog: {
		edit_title: '编辑链接',
		add_title: '添加链接',
		edit_desc: '更新链接元数据以及可选的清洗后内容。',
		add_desc: '手动创建一条 Linkcase 记录，网站 favicon 会自动抓取。',
		saving: '保存中...',
		adding: '添加中...',
		save: '保存',
		add: '添加',
		title: '标题',
		title_placeholder: '可选。默认使用链接地址。',
		link: '链接',
		content: '内容',
		content_hint: '可选。可直接粘贴清洗后的正文内容。',
		content_placeholder: '如果你已经有正文内容，可以直接粘贴到这里。留空则只添加链接。',
		cancel: '取消'
	},
	content: {
		loading: '正在加载内容',
		empty_markdown: '还没有抓取到 Markdown 内容',
		select_hint: '选择一个链接以查看内容'
	},
	toolbar: {
		search_placeholder: '搜索链接',
		filter: '筛选',
		title: '标题',
		link: '链接'
	},
	selection: {
		selected: '已选择 {{count}} 项',
		select_links: '选择链接',
		select_all: '全选',
		unselect_all: '取消全选',
		submitting: '提交中',
		fetch: '抓取',
		clear: '清空',
		removing: '删除中',
		delete: '删除'
	},
	status: {
		none: '无',
		pending: '进行中',
		success: '成功',
		fail: '失败',
		timeout: '超时',
		ignore: '忽略'
	}
} as const

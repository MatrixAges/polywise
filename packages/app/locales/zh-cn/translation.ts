import editor from './editor'
import global from './global'
import provider from './provider'

export default {
	...global,
	editor,
	provider,
	lang_change: {
		title: '切换语言',
		desc: '切换应用语言会强制刷新页面'
	},
	bookmark_panel: {
		auto_clean: '保存前自动清洗书签',
		auto_clean_short: '自动清洗',
		for_wiki: '百科',
		for_memory: '记忆',
		for_user: '个人',
		clear: '清空',
		save: '保存',
		saving: '保存中',
		save_failed: '保存书签失败。'
	},
	login: {
		title: 'Polywise 登录',
		desc: '登录独立 Web 运行时。',
		account: '账号',
		password: '密码',
		password_required: '请输入密码。',
		sign_in: '登录',
		signing_in: '登录中...',
		no_password_configured: '尚未配置密码，请前往设置中完成。'
	},
	model_select: {
		placeholder: '选择默认模型',
		empty: '未找到可用提供方。'
	},
	emoji_panel: {
		placeholder: '表情',
		insert: '插入'
	},
	todos_panel: {
		title: '待办',
		new_placeholder: '新建待办',
		add: '添加',
		rename: '重命名'
	}
} as const

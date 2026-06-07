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
	}
} as const

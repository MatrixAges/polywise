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
	}
} as const

import editor from './editor'
import global from './global'
import provider from './provider'

export default {
	...global,
	editor,
	provider,
	lang_change: {
		title: 'Change Language',
		desc: 'Changing the application language will force a page refresh'
	}
} as const

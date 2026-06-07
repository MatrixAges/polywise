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
	},
	bookmark_panel: {
		auto_clean: 'Auto clean bookmark before save',
		auto_clean_short: 'Auto Clean',
		for_wiki: 'Wiki',
		for_memory: 'Memory',
		for_user: 'User',
		clear: 'Clear',
		save: 'Save',
		saving: 'Saving',
		save_failed: 'Failed to save bookmark.'
	}
} as const

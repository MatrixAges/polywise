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
	},
	login: {
		title: 'Polywise Login',
		desc: 'Sign in to the standalone web runtime.',
		account: 'Account',
		password: 'Password',
		password_required: 'Password is required.',
		sign_in: 'Sign In',
		signing_in: 'Signing in...',
		no_password_configured: 'No password configured yet. Set it in Settings.'
	},
	model_select: {
		placeholder: 'Select a default model',
		empty: 'No providers found.'
	},
	emoji_panel: {
		placeholder: 'Emoji',
		insert: 'Insert'
	},
	todos_panel: {
		title: 'Todos',
		new_placeholder: 'New todo',
		add: 'Add',
		rename: 'Rename'
	}
} as const

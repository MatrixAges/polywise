import ai from './ai'
import app from './app'
import chat from './chat'
import chatbox from './chatbox'
import components from './components'
import editor from './editor'
import global from './global'
import layout from './layout'
import note from './note'
import setting from './setting'

export default {
	translation: {
		...global,
		app,
		setting,
		layout,
		components,
		editor,
		chatbox,
		ai,
		chat,
		note
	}
} as const

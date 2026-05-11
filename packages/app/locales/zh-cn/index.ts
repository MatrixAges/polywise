import editor from './editor'
import global from './global'
import provider from './provider'

export default {
	translation: {
		...global,
		editor,
		provider
	}
} as const

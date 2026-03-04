import global from './global'
import provider from './provider'

export default {
	translation: {
		...global,
		provider
	}
} as const

import buildLinkcasePrompt from '../hooks/buildLinkcasePrompt'
import loadLinkcaseRuntime from '../hooks/loadLinkcaseRuntime'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'linkcase',
	order: 200,
	match: d => d.tags.includes('linkcase'),
	setup: () => ({
		name: 'linkcase',
		hooks: {
			onTools: [loadLinkcaseRuntime],
			onPrompt: [buildLinkcasePrompt]
		}
	})
}

export default plugin

import buildPostPrompt from '../hooks/buildPostPrompt'
import loadPostRuntime from '../hooks/loadPostRuntime'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'post',
	order: 210,
	match: d => d.tags.includes('post'),
	setup: () => ({
		name: 'post',
		hooks: {
			onTools: [loadPostRuntime],
			onPrompt: [buildPostPrompt]
		}
	})
}

export default plugin

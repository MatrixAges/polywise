import buildDefaultRuntime from '../hooks/buildDefaultRuntime'
import buildDefaultSystemPrompt from '../hooks/buildDefaultSystemPrompt'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'default-chat',
	order: 1000,
	match: () => true,
	setup: () => ({
		name: 'default-chat',
		hooks: {
			onTools: [buildDefaultRuntime],
			onPrompt: [buildDefaultSystemPrompt]
		}
	})
}

export default plugin

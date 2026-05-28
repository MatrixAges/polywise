import addBlockedTools from '../hooks/addBlockedTools'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'blocked',
	order: 130,
	match: d => d.tags.includes('blocked'),
	setup: () => ({
		name: 'blocked',
		hooks: {
			onTools: [addBlockedTools]
		}
	})
}

export default plugin

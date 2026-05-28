import finishSubAgents from '../hooks/finishSubAgents'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'sub-agent',
	order: 930,
	match: () => true,
	setup: () => ({
		name: 'sub-agent',
		hooks: {
			onDone: [finishSubAgents]
		}
	})
}

export default plugin

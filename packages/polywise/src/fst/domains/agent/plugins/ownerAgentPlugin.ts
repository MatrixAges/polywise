import addSelfMemoryTool from '../hooks/addSelfMemoryTool'
import appendOwnerAgentPrompt from '../hooks/appendOwnerAgentPrompt'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'owner-agent',
	order: 120,
	match: d => d.tags.includes('owner-agent'),
	setup: () => ({
		name: 'owner-agent',
		hooks: {
			onTools: [addSelfMemoryTool],
			onPrompt: [appendOwnerAgentPrompt]
		}
	})
}

export default plugin

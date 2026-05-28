import advancePlanStage from '../hooks/advancePlanStage'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'plan-exec',
	order: 920,
	match: () => true,
	setup: () => ({
		name: 'plan-exec',
		hooks: {
			onDone: [advancePlanStage]
		}
	})
}

export default plugin

import injectReportTool from '../hooks/injectReportTool'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'report',
	order: 140,
	match: () => true,
	setup: () => ({
		name: 'report',
		hooks: {
			onTools: [injectReportTool]
		}
	})
}

export default plugin

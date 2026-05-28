import updateTitle from '../hooks/updateTitle'

import type { Plugin } from '../../../session/core/types'

const plugin: Plugin = {
	name: 'title',
	order: 940,
	match: () => true,
	setup: () => ({
		name: 'title',
		hooks: {
			onDone: [updateTitle]
		}
	})
}

export default plugin

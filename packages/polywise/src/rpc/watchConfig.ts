import { on } from 'events'

import { config, config_emitter } from '../config'
import { p } from '../utils/trpc'

export default p.subscription(async function* (args) {
	const { signal } = args

	yield config

	try {
		for await (const [data] of on(config_emitter, 'change', { signal })) {
			yield data
		}
	} finally {
	}
})

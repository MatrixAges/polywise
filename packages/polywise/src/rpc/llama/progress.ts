import events from 'events'
import { p } from '@core/utils'

import type { ModelProgress } from '@core/llama'

export const progress_emmiter = new events.EventEmitter()

export default p.subscription(async function* (args) {
	const { signal } = args

	try {
		for await (const [data] of events.on(progress_emmiter, 'change', { signal })) {
			yield data as ModelProgress
		}
	} finally {
		progress_emmiter.removeAllListeners()
	}
})

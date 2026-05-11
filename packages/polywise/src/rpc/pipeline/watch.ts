import events from 'events'
import { p } from '@core/utils'

import { pipeline_emitter } from './emitter'

import type { PipelineRefreshPayload } from './emitter'

export default p.subscription(async function* (args) {
	const { signal } = args

	for await (const [data] of events.on(pipeline_emitter, 'change', { signal })) {
		yield data as PipelineRefreshPayload
	}
})

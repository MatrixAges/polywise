import { content_callback_applied_ttl_ms, content_callback_trace_ttl_ms } from './constants'

import type { ContentCallbackStore } from './types'

export default (store: ContentCallbackStore, now = Date.now()): ContentCallbackStore => {
	const traces = Object.fromEntries(
		Object.entries(store.traces).filter(([, trace]) => now - trace.created_at <= content_callback_trace_ttl_ms)
	)
	const applied_callbacks = Object.fromEntries(
		Object.entries(store.applied_callbacks).filter(
			([, record]) => now - record.created_at <= content_callback_applied_ttl_ms
		)
	)

	return {
		traces,
		applied_callbacks
	}
}

import { recordRewireEvent } from '@core/rewire'
import { log } from '@core/utils'

import applyContentGraphFeedback from './applyContentGraphFeedback'
import buildContentCallbackKey from './buildContentCallbackKey'
import cleanupContentCallbackStore from './cleanupContentCallbackStore'
import getContentCallbackStorePath from './getContentCallbackStorePath'
import readContentCallbackStore from './readContentCallbackStore'
import writeContentCallbackStore from './writeContentCallbackStore'

import type { ContentCallbackSessionRef } from './types'

interface ApplyContentCallbackArgs extends ContentCallbackSessionRef {
	trace_id: string
	hit_items?: Array<string>
	miss_items?: Array<string>
	reason?: string
}

const normalizeItems = (items?: Array<string>) => {
	return Array.from(new Set((items || []).map(item => item.trim()).filter(Boolean)))
}

export default async (args: ApplyContentCallbackArgs) => {
	const { session_dir, session_id, trace_id, reason } = args
	const hit_items = normalizeItems(args.hit_items)
	const miss_items = normalizeItems(args.miss_items)
	const stimulus_key = `content_callback:${trace_id}`

	if (hit_items.length === 0 && miss_items.length === 0) {
		throw new Error('Content callback failed: hit_items and miss_items cannot both be empty')
	}

	const overlap = hit_items.filter(item => miss_items.includes(item))

	if (overlap.length > 0) {
		throw new Error(`Content callback failed: overlapping items found: ${overlap.join(', ')}`)
	}

	const file_path = getContentCallbackStorePath(session_dir)
	const store = cleanupContentCallbackStore(await readContentCallbackStore(file_path))
	const callback_key = buildContentCallbackKey(trace_id, hit_items, miss_items)

	if (store.applied_callbacks[callback_key]) {
		return {
			applied: false,
			trace_id,
			center_node_id: store.traces[trace_id]?.center_node_id ?? null,
			hit_items,
			miss_items,
			reason,
			duplicate: true
		}
	}

	const trace = store.traces[trace_id]

	if (!trace) {
		throw new Error(`Content callback failed: trace not found or expired: ${trace_id}`)
	}

	if (trace.session_id !== session_id) {
		throw new Error(`Content callback failed: trace does not belong to session: ${trace_id}`)
	}

	const allowed_ids = new Set(trace.article_ids)
	const invalid_items = [...hit_items, ...miss_items].filter(item => !allowed_ids.has(item))

	if (invalid_items.length > 0) {
		throw new Error(
			`Content callback failed: items are outside the traced result set: ${invalid_items.join(', ')}`
		)
	}

	const applied_hit_set = new Set(trace.applied_hit_items || [])
	const applied_miss_set = new Set(trace.applied_miss_items || [])
	const conflicting_hit_items = hit_items.filter(item => applied_miss_set.has(item))
	const conflicting_miss_items = miss_items.filter(item => applied_hit_set.has(item))

	if (conflicting_hit_items.length > 0 || conflicting_miss_items.length > 0) {
		throw new Error(`Content callback failed: items cannot switch feedback direction within the same trace`)
	}

	const next_hit_items = hit_items.filter(item => !applied_hit_set.has(item))
	const next_miss_items = miss_items.filter(item => !applied_miss_set.has(item))

	if (next_hit_items.length === 0 && next_miss_items.length === 0) {
		return {
			applied: false,
			trace_id,
			center_node_id: trace.center_node_id,
			hit_items,
			miss_items,
			reason,
			duplicate: true
		}
	}

	const feedback = await applyContentGraphFeedback({
		center_node_id: trace.center_node_id,
		query: trace.query,
		hit_article_ids: next_hit_items,
		miss_article_ids: next_miss_items
	})

	const rewire_tasks = [] as Array<Promise<unknown>>

	if (feedback.global_scope) {
		rewire_tasks.push(
			recordRewireEvent({
				session_id,
				stimulus_key,
				signal: 'content_callback',
				events: [
					{ node_id: feedback.global_scope.center_node_id, role: 'center', strength: 1 },
					...feedback.global_scope.hit_node_ids.map(node_id => ({
						node_id,
						role: 'accepted' as const,
						strength: 1
					})),
					...feedback.global_scope.miss_node_ids.map(node_id => ({
						node_id,
						role: 'rejected' as const,
						strength: 0.35
					}))
				]
			})
		)
	}

	for (const scope_item of feedback.agent_scopes) {
		rewire_tasks.push(
			recordRewireEvent({
				agent_id: scope_item.agent_id,
				session_id,
				stimulus_key,
				signal: 'content_callback',
				events: [
					{ node_id: scope_item.center_node_id, role: 'center', strength: 1 },
					...scope_item.hit_node_ids.map(node_id => ({
						node_id,
						role: 'accepted' as const,
						strength: 1
					})),
					...scope_item.miss_node_ids.map(node_id => ({
						node_id,
						role: 'rejected' as const,
						strength: 0.35
					}))
				]
			})
		)
	}

	await Promise.allSettled(rewire_tasks).then(results => {
		const first_error = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')

		if (!first_error) {
			return
		}

		log('SYSTEM', 'rewireEventRecordFailed', () => ({
			trace_id,
			error: first_error.reason instanceof Error ? first_error.reason.message : String(first_error.reason)
		}))
	})

	trace.applied_hit_items = Array.from(new Set([...trace.applied_hit_items, ...next_hit_items]))
	trace.applied_miss_items = Array.from(new Set([...trace.applied_miss_items, ...next_miss_items]))

	store.applied_callbacks[callback_key] = {
		trace_id,
		created_at: Date.now(),
		hit_items,
		miss_items,
		reason
	}

	await writeContentCallbackStore(file_path, store)

	return {
		applied: true,
		trace_id,
		center_node_id: trace.center_node_id,
		hit_items,
		miss_items,
		reason,
		duplicate: false,
		...feedback
	}
}

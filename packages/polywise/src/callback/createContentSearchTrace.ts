import { getId } from 'stk/utils'

import cleanupContentCallbackStore from './cleanupContentCallbackStore'
import ensureContentCenterNode from './ensureContentCenterNode'
import getContentCallbackStorePath from './getContentCallbackStorePath'
import readContentCallbackStore from './readContentCallbackStore'
import writeContentCallbackStore from './writeContentCallbackStore'

import type { ContentCallbackSessionRef, ContentSearchAction } from './types'

interface CreateContentSearchTraceArgs extends ContentCallbackSessionRef {
	action: ContentSearchAction
	query: string
	article_ids: Array<string>
}

export default async (args: CreateContentSearchTraceArgs) => {
	const { session_dir, session_id, action, query, article_ids } = args
	const { center_node_id, normalized_query } = await ensureContentCenterNode(query)
	const file_path = getContentCallbackStorePath(session_dir)
	const store = cleanupContentCallbackStore(await readContentCallbackStore(file_path))
	const trace_id = getId()

	store.traces[trace_id] = {
		trace_id,
		session_id,
		created_at: Date.now(),
		action,
		query,
		normalized_query,
		center_node_id,
		article_ids,
		applied_hit_items: [],
		applied_miss_items: []
	}

	await writeContentCallbackStore(file_path, store)

	return {
		trace_id,
		center_node_id
	}
}

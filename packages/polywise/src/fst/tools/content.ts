import { applyContentCallback, createContentSearchTrace } from '@core/callback'
import { fullTextSearch, hybirdSearch, relationSearch, saveArticle, semanticSearch } from '@core/io'
import { tool } from 'ai'
import { array, enum as Enum, number, object, string } from 'zod'

import type Session from '../session'

const CONTENT_FOR_TYPES = ['memory', 'wiki', 'linkcase', 'user'] as const
const QUERY_MODES = ['save', 'fullTextSearch', 'semanticSearch', 'relationSearch', 'hybirdSearch', 'callback'] as const

const contentForSchema = Enum(CONTENT_FOR_TYPES)

const inputSchema = object({
	action: Enum(QUERY_MODES).describe(
		'The action to perform. save: store a new content entry. fullTextSearch: run the preferred first-pass keyword/phrase lookup. semanticSearch: expand retrieval when you need semantically related content beyond direct term matches. relationSearch: expand graph-related entities and events when you need deeper associations. hybirdSearch: use only as a fallback when the context is already broad, noisy, or fragmented and you need a catch-all retrieval pass.'
	),
	for: contentForSchema
		.optional()
		.describe('[Required for save] The content category to store: memory, wiki, linkcase, or user'),
	title: string().optional().describe('[Required for save] A short descriptive title for the content'),
	for_types: array(contentForSchema)
		.optional()
		.describe(
			'[Optional for search actions] Limit search to one or more content categories. Omit to search across memory, wiki, linkcase, and user content.'
		),
	content: string().optional().describe('[Required for save] The content to store'),
	query: string().optional().describe('[Required for search actions] Search query for stored content'),
	trace_id: string().optional().describe('[Required for callback] Trace id returned by a previous search'),
	hit_items: array(string())
		.optional()
		.describe(
			'[Optional for callback] Retrieved article ids clearly adopted by the user. Only set when later user messages strongly support the adoption.'
		),
	miss_items: array(string())
		.optional()
		.describe(
			'[Optional for callback] Retrieved article ids clearly not adopted by the user. Use only for explicit or strongly exclusive rejection, otherwise leave empty.'
		),
	reason: string()
		.optional()
		.describe('[Optional for callback] Short reason describing why the callback is strongly supported'),
	max_results: number().optional().describe('[Optional for search actions] Maximum results to return (default 5)'),
	depth: number()
		.int()
		.min(1)
		.max(6)
		.optional()
		.describe('[Optional for relationSearch/hybirdSearch] Graph expansion depth (default 2)')
})

const getSearchIntent = (for_types?: Array<(typeof CONTENT_FOR_TYPES)[number]>) => {
	if (!for_types?.length) return 'all content search'
	if (for_types.length === 1) return `${for_types[0]} content search`

	return `${for_types.join(', ')} content search`
}

export const createContentTool = (s: Session) => {
	return tool({
		description: [
			'Manage stored content across four categories: memory (episodic memory), wiki (knowledge), linkcase (knowledge sources), and user (user or agent-authored content).',
			'Use action "save" to store a new content entry and set the required "for" category and "title".',
			'Use action "fullTextSearch" first for the initial lookup because it is the preferred direct match path.',
			'Use action "semanticSearch" when full-text hits are insufficient and you need semantically related information.',
			'Use action "relationSearch" when you need more associated entities, events, or graph-connected context.',
			'Use action "hybirdSearch" only as an information-backstop when the prior context is already abundant, messy, or fragmented and you need a catch-all retrieval pass.',
			'Use action "callback" only after a prior search when later user messages clearly show which retrieved items were actually adopted or explicitly rejected.',
			'Be conservative with callback: if the user signal is ambiguous, skip callback instead of guessing.',
			'Use "for_types" to narrow retrieval to specific categories, or omit it to search across all stored content.',
			'Search results are ranked by relevance, with recency used as a secondary signal.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'save') {
				if (!input.for) {
					return { action: 'save' as const, error: 'for is required for save action' }
				}

				if (input.for === 'memory' || input.for === 'wiki') {
					return {
						action: 'save' as const,
						error: `${input.for} saves are reserved for pthink review`
					}
				}

				if (!input.content) {
					return { action: 'save' as const, error: 'content is required for save action' }
				}

				if (!input.title) {
					return { action: 'save' as const, error: 'title is required for save action' }
				}

				const article_id = await saveArticle({
					title: input.title,
					content: input.content,
					for: input.for,
					scope_type: s.scope.type === 'group' ? 'global' : s.scope.type,
					scope_id: s.scope.id,
					source: 'agent',
					exec_pipeline: true
				})

				return {
					action: 'save' as const,
					saved: true,
					article_id
				}
			}

			if (input.action === 'callback') {
				if (!input.trace_id) {
					return { action: 'callback' as const, error: 'trace_id is required for callback action' }
				}

				try {
					const result = await applyContentCallback({
						session_id: s.id,
						session_dir: s.session_dir,
						trace_id: input.trace_id,
						hit_items: input.hit_items,
						miss_items: input.miss_items,
						reason: input.reason
					})

					return {
						action: 'callback' as const,
						...result
					}
				} catch (error) {
					return {
						action: 'callback' as const,
						error: error instanceof Error ? error.message : String(error)
					}
				}
			}

			const action = input.action

			if (!input.query) {
				return {
					action,
					error: `query is required for ${action} action`,
					results: []
				}
			}

			const for_types = input.for_types?.length ? input.for_types : undefined
			const runSearch = {
				fullTextSearch,
				semanticSearch,
				relationSearch,
				hybirdSearch
			}[action]
			const results = await runSearch({
				query: input.query,
				intent: getSearchIntent(for_types),
				type: 'article',
				for_types,
				scope_type: s.scope.type === 'group' ? 'global' : s.scope.type,
				scope_id: s.scope.id || undefined,
				depth: input.depth
			})

			const max_results = input.max_results ?? 5
			const visible_results = results.results.slice(0, max_results)
			const trace = await createContentSearchTrace({
				session_id: s.id,
				session_dir: s.session_dir,
				action,
				query: input.query,
				article_ids: visible_results.map(item => item.id)
			})

			return {
				action,
				trace_id: trace.trace_id,
				center_node_id: trace.center_node_id,
				results: visible_results.map(r => ({
					id: r.id,
					content: r.content.slice(0, 50000),
					score: Math.round(r.score * 100) / 100,
					updated_at: r.updated_at
				}))
			}
		}
	})
}

import { addAgentArticle } from '@core/db/services/externals'
import { fullTextSearch, hybirdSearch, relationSearch, saveArticle, semanticSearch } from '@core/io'
import { tool } from 'ai'
import { array, enum as Enum, number, object, string } from 'zod'

import type Session from '../session'

const CONTENT_FOR_TYPES = ['memory', 'wiki', 'linkcase', 'user'] as const
const QUERY_MODES = ['save', 'fullTextSearch', 'semanticSearch', 'relationSearch', 'hybirdSearch'] as const

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
			'Use "for_types" to narrow retrieval to specific categories, or omit it to search across all stored content.',
			'Search results are ranked by relevance, with recency used as a secondary signal.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'save') {
				if (!input.for) {
					return { action: 'save' as const, error: 'for is required for save action' }
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

				if (s.scope.type === 'agent' && s.scope.id) {
					await addAgentArticle(s.scope.id, article_id)
				}

				return {
					action: 'save' as const,
					saved: true,
					article_id
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

			return {
				action,
				results: results.results.slice(0, max_results).map(r => ({
					id: r.id,
					content: r.content.slice(0, 50000),
					score: Math.round(r.score * 100) / 100,
					updated_at: r.updated_at
				}))
			}
		}
	})
}

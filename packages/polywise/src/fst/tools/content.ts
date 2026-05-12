import { addAgentArticle } from '@core/db/services/externals'
import { fullTextSearch, saveArticle, SemanticSearch } from '@core/io'
import { tool } from 'ai'
import { array, enum as Enum, number, object, string } from 'zod'

import type Session from '../session'

const CONTENT_FOR_TYPES = ['memory', 'wiki', 'linkcase', 'user'] as const
const QUERY_MODES = ['save', 'fullTextSearch', 'semanticSearch'] as const

const contentForSchema = Enum(CONTENT_FOR_TYPES)

const inputSchema = object({
	action: Enum(QUERY_MODES).describe(
		'The action to perform. save: store a new content entry. fullTextSearch: run faster direct keyword/phrase matching. semanticSearch: run slower semantic retrieval when more accurate matches are needed.'
	),
	for: contentForSchema
		.optional()
		.describe('[Required for save] The content category to store: memory, wiki, linkcase, or user'),
	title: string().optional().describe('[Required for save] A short descriptive title for the content'),
	for_types: array(contentForSchema)
		.optional()
		.describe(
			'[Optional for fullTextSearch/semanticSearch] Limit search to one or more content categories. Omit to search across memory, wiki, linkcase, and user content.'
		),
	content: string().optional().describe('[Required for save] The content to store'),
	query: string()
		.optional()
		.describe('[Required for fullTextSearch/semanticSearch] Search query for stored content'),
	max_results: number()
		.optional()
		.describe('[Optional for fullTextSearch/semanticSearch] Maximum results to return (default 5)')
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
			'Use action "fullTextSearch" first because it is faster and works well for direct keyword or phrase matching.',
			'Use action "semanticSearch" only when full-text search is insufficient and more accurate semantic retrieval is needed.',
			'Use "for_types" to narrow retrieval to specific categories, or omit it to search across all stored content.',
			'Results are sorted by update time, with the most recent first.'
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
			const runSearch = action === 'fullTextSearch' ? fullTextSearch : SemanticSearch
			const results = await runSearch({
				query: input.query,
				intent: getSearchIntent(for_types),
				type: 'article',
				for_types,
				scope_type: s.scope.type === 'group' ? 'global' : s.scope.type,
				scope_id: s.scope.id || undefined
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

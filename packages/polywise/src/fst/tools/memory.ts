import { addAgentArticle } from '@core/db/services/externals'
import { fullTextSearch, save, SemanticSearch } from '@core/io'
import { tool } from 'ai'
import { enum as Enum, number, object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	action: Enum(['save', 'fullTextSearch', 'SemanticSearch']).describe(
		'The action to perform. save: store a new episodic memory. fullTextSearch: find memories by direct text matching only. SemanticSearch: find memories with semantic retrieval.'
	),
	content: string().optional().describe('[Required for save] The memory content to store'),
	query: string()
		.optional()
		.describe('[Required for fullTextSearch/SemanticSearch] Search query to find existing memories'),
	max_results: number()
		.optional()
		.describe('[Optional for fullTextSearch/SemanticSearch] Maximum results to return (default 5)')
})

export const createMemoryTool = (s: Session) => {
	return tool({
		description: [
			'Manage episodic memories about user preferences, project state, and context.',
			'Use action "save" to store a new memory in the current session scope.',
			'Use action "fullTextSearch" for direct keyword or phrase matching without semantic retrieval.',
			'Use action "SemanticSearch" BEFORE answering when the user asks about their preferences, past decisions, project background, or previously discussed topics.',
			'Results are sorted by update time, with the most recent first.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'save') {
				if (!input.content) {
					return { action: 'save' as const, error: 'content is required for save action' }
				}

				const article_id = await save({
					type: 'article',
					content: input.content,
					for: 'memory',
					scope_type: s.scope.type,
					scope_id: s.scope.id,
					source: 'agent'
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

			if (!input.query) {
				return {
					action: input.action,
					error: `query is required for ${input.action} action`,
					results: []
				}
			}

			const runSearch = input.action === 'fullTextSearch' ? fullTextSearch : SemanticSearch
			const results = await runSearch({
				query: input.query,
				intent: 'memory search',
				type: 'article',
				for_types: ['memory'],
				scope_type: s.scope.type,
				scope_id: s.scope.id || undefined
			})

			const max_results = input.max_results ?? 5

			return {
				action: input.action,
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

import { addAgentArticle } from '@core/db/services/externals'
import { save, search } from '@core/io'
import { tool } from 'ai'
import { enum as Enum, number, object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	action: Enum(['save', 'search']).describe(
		'The action to perform. save: store a new episodic memory. search: find existing memories.'
	),
	content: string().optional().describe('[Required for save] The memory content to store'),
	query: string().optional().describe('[Required for search] Search query to find existing memories'),
	max_results: number().optional().describe('[Optional for search] Maximum results to return (default 5)')
})

export const createMemoryTool = (s: Session) => {
	return tool({
		description: [
			'Manage episodic memories about user preferences, project state, and context.',
			'Use action "save" to store a new memory in the current session scope.',
			'Use action "search" BEFORE answering when the user asks about their preferences, past decisions, project background, or previously discussed topics.',
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
				return { action: 'search' as const, error: 'query is required for search action', results: [] }
			}

			const results = await search({
				query: input.query,
				intent: 'memory search',
				type: 'article',
				for_types: ['memory'],
				scope_type: s.scope.type,
				scope_id: s.scope.id || undefined
			})

			const max_results = input.max_results ?? 5

			return {
				action: 'search' as const,
				results: results.results.slice(0, max_results).map(r => ({
					id: r.id,
					content: r.content.slice(0, 500),
					score: Math.round(r.score * 100) / 100,
					updated_at: r.updated_at
				}))
			}
		}
	})
}

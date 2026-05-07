import { addAgentArticle } from '@core/db/services/externals'
import { save, search } from '@core/io'
import { tool } from 'ai'
import { enum as Enum, number, object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	action: Enum(['save', 'search']).describe(
		'The action to perform. save: store new semantic knowledge. search: find existing knowledge.'
	),
	content: string().optional().describe('[Required for save] The knowledge content to store'),
	query: string().optional().describe('[Required for search] Search query to find existing knowledge'),
	max_results: number().optional().describe('[Optional for search] Maximum results to return (default 5)')
})

export const createWikiTool = (s: Session) => {
	return tool({
		description: [
			'Manage semantic knowledge: objective facts, concepts, architecture docs, API definitions, and technical conclusions.',
			'Use action "save" to store new reusable knowledge in the current session scope.',
			'Use action "search" BEFORE answering when the user asks about technical details, architecture decisions, or any factual question that may have been documented.',
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
					for: 'wiki',
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
				intent: 'knowledge search',
				type: 'article',
				for_types: ['wiki'],
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

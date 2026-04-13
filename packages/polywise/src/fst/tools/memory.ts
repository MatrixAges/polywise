import { search } from '@core/io'
import { tool } from 'ai'
import { number, object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	query: string().describe('Search query to find existing memories'),
	max_results: number().optional().describe('Maximum results to return (default 6)')
})

export const createMemoryTool = (s: Session) => {
	return tool({
		description: [
			'Search episodic memories about user preferences, project state, and context.',
			'This is a read-only tool. Use superego to explicitly request storing new memories.',
			'Use this to recall previously stored information about the user or project.',
			'Results are sorted by update time, with the most recent first.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			const results = await search({
				query: input.query,
				intent: 'memory search',
				type: 'article',
				scope_type: s.scope.type,
				scope_id: s.scope.id || undefined
			})

			const max_results = input.max_results ?? 5

			return {
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

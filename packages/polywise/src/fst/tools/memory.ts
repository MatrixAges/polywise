import { search as ioSearch } from '@core/io'
import { tool } from 'ai'
import { number, object, string } from 'zod'

import type Session from '../session'

const getScope = (s: Session) => {
	if (s.project) {
		return { scope_type: 'project' as const, scope_id: s.project.id }
	}

	if (s.agents.length > 0) {
		return { scope_type: 'agent' as const, scope_id: s.agents[0].id }
	}

	return { scope_type: 'global' as const, scope_id: null }
}

const inputSchema = object({
	query: string().describe('Search query to find existing memories'),
	max_results: number().optional().describe('Maximum results to return (default 5)')
})

export const createMemoryTool = (s: Session) => {
	return tool({
		description: [
			'Search episodic memories about user preferences, project state, and context.',
			'This is a read-only tool. Use superego_tool to explicitly request storing new memories.',
			'Use this to recall previously stored information about the user or project.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			const results = await ioSearch({
				query: input.query,
				intent: 'memory search',
				type: 'article'
			})

			const max_results = input.max_results ?? 5

			return {
				query: input.query,
				results: results.results.slice(0, max_results).map(r => ({
					id: r.id,
					content: r.content.slice(0, 500),
					score: r.score
				})),
				count: results.results.length
			}
		}
	})
}

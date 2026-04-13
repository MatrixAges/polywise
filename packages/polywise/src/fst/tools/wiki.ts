import { search as ioSearch } from '@core/io'
import { tool } from 'ai'
import { number, object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	query: string().describe('Search query to find existing knowledge'),
	max_results: number().optional().describe('Maximum results to return (default 5)')
})

export const createWikiTool = (s: Session) => {
	return tool({
		description: [
			'Search semantic knowledge: objective facts, concepts, architecture docs, API definitions, and technical conclusions.',
			'This is a read-only tool. Use superego_tool to explicitly request storing new knowledge.',
			'Use this to recall previously stored technical knowledge and documentation.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			const results = await ioSearch({
				query: input.query,
				intent: 'knowledge search',
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

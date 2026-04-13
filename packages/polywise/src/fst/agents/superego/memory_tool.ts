import { article } from '@core/db/schema'
import { setArticle } from '@core/db/services'
import { save, search } from '@core/io'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { enum as Enum, object, string } from 'zod'

import type { ScopeInfo } from './types'

const inputSchema = object({
	action: Enum(['add', 'search', 'update']).describe(
		'The action to perform. add: store new episodic memory. search: check for existing memories. update: modify an existing memory by id.'
	),
	content: string().describe('[Required for add/update] The memory content to store or update'),
	query: string().optional().describe('[Required for search] Search query to find existing memories'),
	article_id: string().optional().describe('[Required for update] The article id of the memory to update')
})

export const createMemoryTool = (scope: ScopeInfo) => {
	return tool({
		description: [
			'Manage episodic memories about user preferences, project state, and context.',
			'Use action "add" to store new memories about the user or project.',
			'Use action "search" to check if a memory already exists before adding.',
			'Use action "update" to modify an existing memory by article_id.',
			'All memories are scoped to the current session context.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'add') {
				if (!input.content) {
					return 'Memory add failed: content is required'
				}

				save({
					type: 'article',
					content: input.content,
					for: 'memory',
					scope_type: scope.scope_type,
					scope_id: scope.scope_id,
					source: 'superego'
				})

				return 'Memory add queued.'
			}

			if (input.action === 'search') {
				if (!input.query) {
					return 'Memory search failed: query is required'
				}

				const results = await search({
					query: input.query,
					intent: 'memory search',
					type: 'article'
				})

				const top = results.results.slice(0, 3)

				if (top.length === 0) {
					return `Memory search '${input.query}' found 0 results.`
				}

				const items = top.map(r => `- [${r.id}] ${r.content.slice(0, 100)}`).join('\n')

				return `Memory search '${input.query}' found ${results.results.length} results:\n${items}`
			}

			if (input.action === 'update') {
				if (!input.article_id) {
					return 'Memory update failed: article_id is required'
				}

				if (!input.content) {
					return 'Memory update failed: content is required'
				}

				setArticle(eq(article.id, input.article_id), {
					content: input.content,
					updated_at: new Date()
				})

				return `Memory update queued for id: ${input.article_id}`
			}

			return 'Unknown action'
		}
	})
}

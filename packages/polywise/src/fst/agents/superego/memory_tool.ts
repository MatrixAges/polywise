import { article } from '@core/db/schema'
import { getArticle, setArticle } from '@core/db/services'
import { remove as ioRemove, search as ioSearch, save } from '@core/io'
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
					return { action: 'add', error: 'content is required for add action' }
				}

				const id = await save({
					type: 'article',
					content: input.content,
					for: 'memory',
					scope_type: scope.scope_type,
					scope_id: scope.scope_id,
					source: 'superego'
				})

				return { action: 'add', id, status: 'saved' }
			}

			if (input.action === 'search') {
				if (!input.query) {
					return { action: 'search', error: 'query is required for search action' }
				}

				const results = await ioSearch({
					query: input.query,
					intent: 'memory search',
					type: 'article'
				})

				return {
					action: 'search',
					query: input.query,
					results: results.results.slice(0, 5).map(r => ({
						id: r.id,
						content: r.content.slice(0, 200),
						score: r.score
					})),
					count: results.results.length
				}
			}

			if (input.action === 'update') {
				if (!input.article_id) {
					return { action: 'update', error: 'article_id is required for update action' }
				}

				if (!input.content) {
					return { action: 'update', error: 'content is required for update action' }
				}

				const existing = await getArticle(eq(article.id, input.article_id))

				if (!existing) {
					return { action: 'update', error: `Article not found: ${input.article_id}` }
				}

				await setArticle(eq(article.id, input.article_id), {
					content: input.content,
					updated_at: new Date()
				})

				return { action: 'update', id: input.article_id, status: 'updated' }
			}

			return { error: 'Unknown action' }
		}
	})
}

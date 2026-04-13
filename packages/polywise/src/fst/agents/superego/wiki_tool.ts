import { article } from '@core/db/schema'
import { getArticle, setArticle } from '@core/db/services'
import { remove, save, search } from '@core/io'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { enum as Enum, object, string } from 'zod'

import type { ScopeInfo } from './types'

const slog = (msg: string) => console.log(`[SUPEREGO:wiki] ${msg}`)

const inputSchema = object({
	action: Enum(['add', 'search', 'update', 'remove']).describe(
		'The action to perform. add: store new semantic knowledge. search: verify if knowledge exists. update: correct outdated knowledge. remove: eliminate falsified facts.'
	),
	content: string().optional().describe('[Required for add/update] The knowledge content to store or update'),
	query: string().optional().describe('[Required for search] Search query to find existing knowledge'),
	article_id: string().optional().describe('[Required for update/remove] The article id to modify or delete')
})

export const createWikiTool = (scope: ScopeInfo) => {
	return tool({
		description: [
			'Manage semantic knowledge: objective facts, concepts, architecture docs, API definitions, and technical conclusions.',
			'Use action "add" to store new reusable knowledge.',
			'Use action "search" to check if knowledge already exists before adding.',
			'Use action "update" to correct outdated knowledge by article_id.',
			'Use action "remove" to eliminate falsified facts by article_id.',
			'Content must be highly structured and objective. Strip conversational tone.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'add') {
				if (!input.content) {
					return { action: 'add', error: 'content is required for add action' }
				}

				slog(`add | content: ${input.content.slice(0, 100)}`)

				const id = await save({
					type: 'article',
					content: input.content,
					for: 'wiki',
					scope_type: scope.scope_type,
					scope_id: scope.scope_id,
					source: 'superego'
				})

				slog(`add done | id: ${id}`)

				return { action: 'add', id, status: 'saved' }
			}

			if (input.action === 'search') {
				if (!input.query) {
					return { action: 'search', error: 'query is required for search action' }
				}

				slog(`search | query: ${input.query}`)

				const results = await search({
					query: input.query,
					intent: 'knowledge search',
					type: 'article'
				})

				slog(`search done | results: ${results.results.length}`)

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

			if (input.action === 'remove') {
				if (!input.article_id) {
					return { action: 'remove', error: 'article_id is required for remove action' }
				}

				await remove(input.article_id)

				return { action: 'remove', id: input.article_id, status: 'removed' }
			}

			return { error: 'Unknown action' }
		}
	})
}

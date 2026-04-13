import { article } from '@core/db/schema'
import { setArticle } from '@core/db/services'
import { remove, save, search } from '@core/io'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { enum as Enum, object, string } from 'zod'

import type { ScopeInfo } from './types'

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
					return 'Wiki add failed: content is required'
				}

				save({
					type: 'article',
					content: input.content,
					for: 'wiki',
					scope_type: scope.scope_type,
					scope_id: scope.scope_id,
					source: 'superego'
				}).catch(() => {})

				return 'Wiki add queued.'
			}

			if (input.action === 'search') {
				if (!input.query) {
					return 'Wiki search failed: query is required'
				}

				const results = await search({
					query: input.query,
					intent: 'knowledge search',
					type: 'article'
				})

				const top = results.results.slice(0, 3)

				if (top.length === 0) {
					return `Wiki search '${input.query}' found 0 results.`
				}

				const items = top.map(r => `- [${r.id}] ${r.content.slice(0, 100)}`).join('\n')

				return `Wiki search '${input.query}' found ${results.results.length} results:\n${items}`
			}

			if (input.action === 'update') {
				if (!input.article_id) {
					return 'Wiki update failed: article_id is required'
				}

				if (!input.content) {
					return 'Wiki update failed: content is required'
				}

				setArticle(eq(article.id, input.article_id), {
					content: input.content,
					updated_at: new Date()
				}).catch(() => {})

				return `Wiki update queued for id: ${input.article_id}`
			}

			if (input.action === 'remove') {
				if (!input.article_id) {
					return 'Wiki remove failed: article_id is required'
				}

				remove(input.article_id).catch(() => {})

				return `Wiki remove queued for id: ${input.article_id}`
			}

			return 'Unknown action'
		}
	})
}

import { article } from '@core/db/schema'
import { setArticle } from '@core/db/services'
import { addAgentArticle } from '@core/db/services/externals'
import { fullTextSearch, remove, saveArticle, SemanticSearch } from '@core/io'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { enum as Enum, object, string } from 'zod'

import type { SessionScope } from '../../types'

const CONTENT_FOR_TYPES = ['memory', 'wiki', 'linkcase', 'user'] as const
const SEARCH_MODES = ['fullTextSearch', 'semanticSearch'] as const

const inputSchema = object({
	action: Enum(['add', 'search', 'update', 'remove']).describe(
		'The action to perform. add: store new content. search: look for existing content before adding or updating. update: modify an existing entry by id. remove: delete an entry by id.'
	),
	for: Enum(CONTENT_FOR_TYPES)
		.optional()
		.describe('[Required for add/search] The content category: memory, wiki, linkcase, or user'),
	title: string().optional().describe('[Required for add] A short descriptive title for the content'),
	search_mode: Enum(SEARCH_MODES)
		.optional()
		.describe(
			'[Optional for search] Prefer fullTextSearch first; use semanticSearch only when direct matching is insufficient'
		),
	content: string().optional().describe('[Required for add/update] The content to store or update'),
	query: string().optional().describe('[Required for search] Search query to find existing content'),
	article_id: string().optional().describe('[Required for update/remove] The article id to modify or delete')
})

const getLabel = (for_type: (typeof CONTENT_FOR_TYPES)[number]) => {
	if (for_type === 'memory') return 'Memory'
	if (for_type === 'wiki') return 'Wiki'
	if (for_type === 'linkcase') return 'Linkcase'
	return 'User content'
}

export const createContentTool = (scope: SessionScope) => {
	return tool({
		description: [
			'Manage durable content for the learning loop using four categories: memory, wiki, linkcase, and user.',
			'Use "for" to choose the category for add/search actions.',
			'For add, provide a concise "title" that summarizes the content being stored.',
			'For search, prefer "fullTextSearch" first because it is faster. Escalate to "semanticSearch" only when needed for better recall.',
			'Use update/remove with article_id when an existing entry should be corrected or deleted.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'add') {
				if (!input.for) {
					return 'Content add failed: for is required'
				}

				if (!input.content) {
					return 'Content add failed: content is required'
				}

				if (!input.title) {
					return 'Content add failed: title is required'
				}

				const article_id = await saveArticle({
					title: input.title,
					content: input.content,
					for: input.for,
					scope_type: scope.type === 'group' ? 'global' : scope.type,
					scope_id: scope.id,
					source: 'superego',
					exec_pipeline: true
				})

				if (scope.type === 'agent' && scope.id) {
					await addAgentArticle(scope.id, article_id)
				}

				return `Content add queued for ${input.for}.`
			}

			if (input.action === 'search') {
				if (!input.for) {
					return 'Content search failed: for is required'
				}

				if (!input.query) {
					return 'Content search failed: query is required'
				}

				const search_mode = input.search_mode ?? 'fullTextSearch'
				const runSearch = search_mode === 'fullTextSearch' ? fullTextSearch : SemanticSearch
				const results = await runSearch({
					query: input.query,
					intent: `${input.for} content search`,
					type: 'article',
					for_types: [input.for],
					scope_type: scope.type === 'group' ? 'global' : scope.type,
					scope_id: scope.id ?? undefined
				})

				const top = results.results.slice(0, 3)
				const label = getLabel(input.for)

				if (top.length === 0) {
					return `${label} search '${input.query}' with ${search_mode} found 0 results.`
				}

				const items = top.map(r => `- [${r.id}] ${r.content.slice(0, 100)}`).join('\n')

				return `${label} search '${input.query}' with ${search_mode} found ${results.results.length} results:\n${items}`
			}

			if (input.action === 'update') {
				if (!input.article_id) {
					return 'Content update failed: article_id is required'
				}

				if (!input.content) {
					return 'Content update failed: content is required'
				}

				setArticle(eq(article.id, input.article_id), {
					content: input.content,
					updated_at: new Date()
				})

				return `Content update queued for id: ${input.article_id}`
			}

			if (input.action === 'remove') {
				if (!input.article_id) {
					return 'Content remove failed: article_id is required'
				}

				remove(input.article_id)

				return `Content remove queued for id: ${input.article_id}`
			}

			return 'Unknown action'
		}
	})
}

import { article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import { saveArticle } from '@core/io'
import { eq } from 'drizzle-orm'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	article_id: string(),
	title: string(),
	content: string(),
	for: zod_enum(['linkcase', 'wiki', 'memory', 'user']),
	exec_pipeline: boolean().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_article = await getArticle(eq(article.id, input.article_id))

	if (!current_article) {
		throw new Error(`Article not found: ${input.article_id}`)
	}

	return saveArticle({
		article_id: input.article_id,
		title: input.title,
		content: input.content,
		for: input.for,
		scope_type: (current_article.scope_type as 'global' | 'project' | 'agent' | null) || 'agent',
		scope_id: current_article.scope_id,
		exec_pipeline: input.exec_pipeline
	})
})

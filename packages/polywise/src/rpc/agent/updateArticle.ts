import { article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import save from '@core/io/save'
import { eq } from 'drizzle-orm'
import { object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	article_id: string(),
	content: string(),
	for: zod_enum(['linkcase', 'wiki', 'memory', 'user'])
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_article = await getArticle(eq(article.id, input.article_id))

	if (!current_article) {
		throw new Error(`Article not found: ${input.article_id}`)
	}

	return save({
		type: 'article',
		id: input.article_id,
		content: input.content,
		for: input.for,
		scope_type: (current_article.scope_type as 'global' | 'project' | 'agent' | null) || 'agent',
		scope_id: current_article.scope_id
	})
})

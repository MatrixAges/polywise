import { article } from '@core/db/schema'
import { boolean, date, object, string } from 'zod'

import type { Article } from '@core/db/types'

export const article_for_type = article.for.enumValues

export const article_detail_schema = object({
	id: string(),
	title: string().nullable(),
	content: string(),
	for_type: string(),
	source: string().nullable(),
	is_pipelined: boolean(),
	created_at: date().nullable(),
	updated_at: date().nullable()
})

export const serializeArticleDetail = (target_article: Article) => ({
	id: target_article.id,
	title: target_article.title,
	content: target_article.content,
	for_type: target_article.for,
	source: target_article.source ?? null,
	is_pipelined: target_article.is_pipelined,
	created_at: target_article.created_at,
	updated_at: target_article.updated_at
})

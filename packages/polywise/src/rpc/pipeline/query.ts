import { article } from '@core/db/schema'
import { env } from '@core/env'
import { readPipelineStore } from '@core/io/save/pipelineStore'
import { p } from '@core/utils'
import { inArray } from 'drizzle-orm'

export interface PipelineTaskItem {
	article_id: string
	title: string
	status: 'running' | 'done' | 'error'
	created_at: string
	done_at: string | null
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/pipeline/query',
			summary: 'Read Query'
		}
	})
	.query(async () => {
		const store = await readPipelineStore()
		const article_ids = Object.keys(store)

		if (article_ids.length === 0) return [] as Array<PipelineTaskItem>

		const article_items = await env.db
			.select({
				id: article.id,
				title: article.title,
				content: article.content
			})
			.from(article)
			.where(inArray(article.id, article_ids))

		const article_map = Object.fromEntries(
			article_items.map(item => [
				item.id,
				item.title?.trim() || item.content.trim().split('\n').find(Boolean)?.slice(0, 80) || item.id
			])
		)

		return article_ids
			.map(article_id => {
				const task = store[article_id]

				return {
					article_id,
					title: article_map[article_id] || article_id,
					status: task.status,
					created_at: task.created_at,
					done_at: task.done_at
				} satisfies PipelineTaskItem
			})
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
	})

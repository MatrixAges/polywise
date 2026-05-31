import { article } from '@core/db/schema'
import { env } from '@core/env'
import { readPipelineLogs, readPipelineStore } from '@core/io/save/pipelineStore'
import { p } from '@core/utils'
import { inArray } from 'drizzle-orm'

export interface PipelineTaskItem {
	task_key: string
	article_id: string
	title: string
	status: 'running' | 'done' | 'error'
	created_at: string
	done_at: string | null
	error_message: string | null
	source: 'active' | 'history'
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/pipeline/query',
			description:
				'List recent pipeline tasks from active state and history logs, including article titles and status.'
		}
	})
	.query(async () => {
		const [store, history_rows] = await Promise.all([readPipelineStore(), readPipelineLogs(20)])
		const active_rows = Object.entries(store).map(([article_id, task]) => ({
			article_id,
			...task,
			source: 'active' as const
		}))
		const history = history_rows.map(item => ({
			...item,
			source: 'history' as const
		}))
		const article_ids = [
			...new Set([...active_rows.map(item => item.article_id), ...history.map(item => item.article_id)])
		]

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

		return [...active_rows, ...history]
			.map(task => ({
				task_key: `${task.article_id}:${task.created_at}:${task.done_at || 'pending'}:${task.source}`,
				article_id: task.article_id,
				title: article_map[task.article_id] || task.article_id,
				status: task.status,
				created_at: task.created_at,
				done_at: task.done_at,
				error_message: task.error_message ?? null,
				source: task.source
			}))
			.sort(
				(a, b) =>
					new Date(b.done_at || b.created_at).getTime() -
					new Date(a.done_at || a.created_at).getTime()
			)
	})

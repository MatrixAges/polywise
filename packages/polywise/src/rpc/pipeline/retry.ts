import { article, link_article, post_article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import { env } from '@core/env'
import { saveArticle } from '@core/io'
import { getPipelineTask } from '@core/io/save/pipelineStore'
import { getArticleGraphBackfill } from '@core/io/save/saveArticle'
import { triggerPrivateAgentArticleExtract } from '@core/rpc/agent/privateArticle'
import { extractLinkcaseArticle } from '@core/rpc/linkcase/utils'
import { extractPostArticle } from '@core/rpc/post/utils'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

const retryArticlePipeline = async (article_id: string) => {
	const article_item = await getArticle(eq(article.id, article_id))

	if (!article_item) {
		throw new Error(`Article not found: ${article_id}`)
	}

	if (article_item.scope_type === 'agent' && article_item.scope_id) {
		await triggerPrivateAgentArticleExtract({
			agent_id: article_item.scope_id,
			article_id,
			force: true
		})

		return {
			queued: true
		}
	}

	const link_binding = await env.db
		.select({ link_id: link_article.link_id })
		.from(link_article)
		.where(eq(link_article.article_id, article_id))
		.limit(1)
		.then(rows => rows[0] ?? null)

	if (link_binding) {
		await extractLinkcaseArticle({
			id: link_binding.link_id,
			force: true
		})

		return {
			queued: true
		}
	}

	const post_binding = await env.db
		.select({ post_id: post_article.post_id })
		.from(post_article)
		.where(eq(post_article.article_id, article_id))
		.limit(1)
		.then(rows => rows[0] ?? null)

	if (post_binding) {
		await extractPostArticle({
			id: post_binding.post_id,
			force: true
		})

		return {
			queued: true
		}
	}

	await saveArticle({
		article_id: article_item.id,
		title: article_item.title,
		content: article_item.content,
		for: article_item.for,
		scope_type: article_item.scope_type ?? 'global',
		scope_id: article_item.scope_id,
		source: article_item.source ?? 'agent',
		metadata: article_item.metadata,
		exec_pipeline: true,
		await_graph_sync: Boolean(getArticleGraphBackfill(article_item.metadata))
	})

	return {
		queued: true
	}
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/pipeline/retry',
			description: 'Retry one failed or timed-out pipeline task.'
		}
	})
	.input(
		object({
			article_id: string()
		})
	)
	.mutation(async ({ input }) => {
		const current_task = await getPipelineTask(input.article_id)

		if (current_task && (current_task.status === 'running' || current_task.status === 'queued')) {
			throw new Error(`Pipeline task is still active: ${input.article_id}`)
		}

		return retryArticlePipeline(input.article_id)
	})

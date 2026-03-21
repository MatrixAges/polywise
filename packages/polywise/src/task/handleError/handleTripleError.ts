import { article, chunk } from '@core/db/schema'
import { env } from '@core/env'
import { log } from '@core/utils'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import type { TripleTaskArgs } from '../types'

export default async (args: TripleTaskArgs) => {
	const { chunk_item_id } = args

	const [query_err, chunk_result] = await to(
		env.db.select({ article_id: chunk.article_id }).from(chunk).where(eq(chunk.id, chunk_item_id))
	)

	if (query_err) {
		log('TASK_QUEUE', 'getChunkError', () => `${chunk_item_id}: ${query_err}`)

		return
	}

	if (!chunk_result?.[0]?.article_id) return

	const [update_err] = await to(
		env.db.update(article).set({ is_tripled: false }).where(eq(article.id, chunk_result[0].article_id))
	)

	if (update_err) {
		log('TASK_QUEUE', 'updateArticleError', () => `${chunk_result[0].article_id}: ${update_err}`)
	}
}

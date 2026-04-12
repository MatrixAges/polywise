import { article, chunk } from '@core/db/schema'
import { getChunks, setArticle } from '@core/db/services'
import { log } from '@core/utils'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import type { TripleTaskArgs } from '../types'

export default async (args: TripleTaskArgs) => {
	const { chunk_item_id } = args

	const [query_err, chunk_result] = await to(
		getChunks({
			where: eq(chunk.id, chunk_item_id)
		})
	)

	if (query_err) {
		log('TASK_QUEUE', 'getChunkError', () => `${chunk_item_id}: ${query_err}`)

		return
	}

	if (!chunk_result?.[0]?.article_id) return

	const [update_err] = await to(setArticle(eq(article.id, chunk_result[0].article_id), { is_tripled: false }))

	if (update_err) {
		log('TASK_QUEUE', 'updateArticleError', () => `${chunk_result[0].article_id}: ${update_err}`)
	}
}

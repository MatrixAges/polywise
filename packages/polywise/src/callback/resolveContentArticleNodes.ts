import { chunk, node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { eq, inArray } from 'drizzle-orm'

export default async (article_ids: Array<string>) => {
	const node_map = new Map<string, Set<string>>()

	if (article_ids.length === 0) {
		return node_map
	}

	const rows = await env.db
		.select({
			article_id: chunk.article_id,
			node_id: node_chunk.node_id
		})
		.from(chunk)
		.innerJoin(node_chunk, eq(node_chunk.chunk_id, chunk.id))
		.where(inArray(chunk.article_id, article_ids))

	for (const row of rows) {
		const article_id = row.article_id
		const node_id = row.node_id

		if (!article_id || !node_id) {
			continue
		}

		if (!node_map.has(article_id)) {
			node_map.set(article_id, new Set())
		}

		node_map.get(article_id)?.add(node_id)
	}

	return node_map
}

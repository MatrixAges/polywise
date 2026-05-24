import { chunk, node, node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { eq, inArray } from 'drizzle-orm'

export interface ContentArticleNodeRef {
	node_id: string
	agent_id: string | null
	is_frozen: boolean
}

export default async (article_ids: Array<string>) => {
	const node_map = new Map<string, Map<string, ContentArticleNodeRef>>()

	if (article_ids.length === 0) {
		return new Map<string, Array<ContentArticleNodeRef>>()
	}

	const rows = await env.db
		.select({
			article_id: chunk.article_id,
			node_id: node_chunk.node_id,
			agent_id: node.agent_id,
			is_frozen: node.is_frozen
		})
		.from(chunk)
		.innerJoin(node_chunk, eq(node_chunk.chunk_id, chunk.id))
		.innerJoin(node, eq(node.id, node_chunk.node_id))
		.where(inArray(chunk.article_id, article_ids))

	for (const row of rows) {
		const article_id = row.article_id
		const node_id = row.node_id

		if (!article_id || !node_id) {
			continue
		}

		if (!node_map.has(article_id)) {
			node_map.set(article_id, new Map())
		}

		node_map.get(article_id)?.set(node_id, {
			node_id,
			agent_id: row.agent_id ?? null,
			is_frozen: Boolean(row.is_frozen)
		})
	}

	return new Map(
		Array.from(node_map.entries()).map(([article_id, items]) => [article_id, Array.from(items.values())])
	)
}

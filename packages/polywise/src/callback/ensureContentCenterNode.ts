import { getNodeRowid, insertNodeVector } from '@core/db/prepare'
import { node } from '@core/db/schema'
import { addNode, getNode } from '@core/db/services'
import { getEmbedding } from '@core/pipeline'
import { and, eq, sql } from 'drizzle-orm'

import { content_callback_query_prefix } from './constants'
import normalizeContentCallbackQuery from './normalizeContentCallbackQuery'

export default async (query: string) => {
	const normalized_query = normalizeContentCallbackQuery(query)
	const node_name = `${content_callback_query_prefix}${normalized_query}`
	const existing = await getNode(and(sql`${node.agent_id} is null`, eq(node.name, node_name)))

	if (existing) {
		return {
			center_node_id: existing.id,
			normalized_query,
			node_name
		}
	}

	const inserted = await addNode({
		agent_id: null,
		name: node_name
	}).catch(() => null)

	if (!inserted) {
		const current = await getNode(and(sql`${node.agent_id} is null`, eq(node.name, node_name)))

		if (current) {
			return {
				center_node_id: current.id,
				normalized_query,
				node_name
			}
		}

		throw new Error(`Failed to ensure content center node: ${node_name}`)
	}
	const embedding = await getEmbedding(node_name)
	const row = getNodeRowid().get(inserted.id) as { rowid: number } | undefined

	if (row) {
		insertNodeVector().run(BigInt(row.rowid), Buffer.from(new Float32Array(embedding).buffer))
	}

	return {
		center_node_id: inserted.id,
		normalized_query,
		node_name
	}
}

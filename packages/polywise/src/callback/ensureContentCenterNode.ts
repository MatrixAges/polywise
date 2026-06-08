import { deleteNodeFts, getNodeRowid, insertNodeFts } from '@core/db/prepare'
import { node } from '@core/db/schema'
import { addNode, getNode } from '@core/db/services'
import { and, eq, sql } from 'drizzle-orm'

import { content_callback_query_prefix } from './constants'
import normalizeContentCallbackQuery from './normalizeContentCallbackQuery'

const getCenterNodeWhere = (node_name: string, agent_id?: string | null) =>
	agent_id
		? and(eq(node.agent_id, agent_id), eq(node.name, node_name))
		: and(sql`${node.agent_id} is null`, eq(node.name, node_name))

export default async (query: string, agent_id?: string | null) => {
	const normalized_query = normalizeContentCallbackQuery(query)
	const node_name = `${content_callback_query_prefix}${normalized_query}`
	const existing = await getNode(getCenterNodeWhere(node_name, agent_id))

	if (existing) {
		return {
			center_node_id: existing.id,
			agent_id: agent_id ?? null,
			normalized_query,
			node_name
		}
	}

	const inserted = await addNode({
		agent_id: agent_id ?? null,
		name: node_name
	}).catch(() => null)

	if (!inserted) {
		const current = await getNode(getCenterNodeWhere(node_name, agent_id))

		if (current) {
			return {
				center_node_id: current.id,
				agent_id: agent_id ?? null,
				normalized_query,
				node_name
			}
		}

		throw new Error(`Failed to ensure content center node: ${node_name}`)
	}

	const row = getNodeRowid().get(inserted.id) as { rowid: number } | undefined

	if (row) {
		deleteNodeFts().run(BigInt(row.rowid))
		insertNodeFts().run(BigInt(row.rowid), node_name)
	}

	return {
		center_node_id: inserted.id,
		agent_id: agent_id ?? null,
		normalized_query,
		node_name
	}
}

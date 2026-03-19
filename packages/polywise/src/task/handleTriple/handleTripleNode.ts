import { node, node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { getEmbedding } from '@core/pipeline'
import { log } from '@core/utils'
import { and, eq } from 'drizzle-orm'

import type { SqliteRow } from '@core/types'

interface Args {
	node_name: string
	agent_id: string
	chunk_id: string
}

export default async (args: Args) => {
	const { node_name, agent_id, chunk_id } = args

	const insert_node_vec = env.sqlite.prepare('INSERT INTO vec.node_vec(rowid, vectors) VALUES (?, ?)')

	const [exist_node] = await env.db
		.select()
		.from(node)
		.where(and(eq(node.agent_id, agent_id), eq(node.name, node_name)))
		.limit(1)

	let node_id = exist_node?.id

	log('SAVE', 'getExistNode', () => `node_id: ${node_id}`)

	if (!node_id) {
		const [new_node] = await env.db
			.insert(node)
			.values({ agent_id, name: node_name })
			.returning({ id: node.id })

		node_id = new_node.id

		log('SAVE', 'insertNewNode', () => `node_id: ${node_id}`)

		const { rowid: node_rowid } = env.sqlite
			.prepare('SELECT rowid FROM node WHERE id = ?')
			.get(node_id) as SqliteRow

		const node_vector = await getEmbedding(node_name)

		log('SAVE', 'saveNodeVector')

		insert_node_vec.run(BigInt(node_rowid), Buffer.from(new Float32Array(node_vector).buffer))
	}

	await env.db.insert(node_chunk).values({ node_id, chunk_id }).onConflictDoNothing()

	return node_id
}

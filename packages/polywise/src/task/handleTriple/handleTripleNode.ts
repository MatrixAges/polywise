import { getNodeRowid, insertNodeVector } from '@core/db/prepare'
import { node, node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { getEmbedding } from '@core/pipeline'
import { log } from '@core/utils'
import { eq } from 'drizzle-orm'

interface Args {
	node_name: string
	chunk_id: string
}

export default async (args: Args) => {
	const { node_name, chunk_id } = args

	const [exist_node] = await env.db.select().from(node).where(eq(node.name, node_name)).limit(1)

	let node_id = exist_node?.id

	log('SAVE', 'getExistNode', () => `node_id: ${node_id}`)

	if (!node_id) {
		const [new_node] = await env.db.insert(node).values({ name: node_name }).returning({ id: node.id })

		node_id = new_node.id

		log('SAVE', 'insertNewNode', () => `node_id: ${node_id}`)

		const { rowid: node_rowid } = getNodeRowid().get(node_id) as { rowid: number }

		const node_vector = await getEmbedding(node_name)

		log('SAVE', 'saveNodeVector')

		insertNodeVector().run(BigInt(node_rowid), Buffer.from(new Float32Array(node_vector).buffer))
	}

	await env.db.insert(node_chunk).values({ node_id, chunk_id }).onConflictDoNothing()

	return node_id
}

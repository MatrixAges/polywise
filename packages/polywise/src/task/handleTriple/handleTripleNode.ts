import { getNodeRowid, insertNodeVector } from '@core/db/prepare'
import { node } from '@core/db/schema'
import { addNode, addNodeChunk, getNode } from '@core/db/services'
import { getEmbedding } from '@core/pipeline'
import { log } from '@core/utils'
import { eq } from 'drizzle-orm'

interface Args {
	node_name: string
	chunk_id: string
}

export default async (args: Args) => {
	const { node_name, chunk_id } = args

	const exist_node = await getNode(eq(node.name, node_name))

	let node_id = exist_node?.id

	log('SAVE', 'getExistNode', () => `node_id: ${node_id}`)

	if (!node_id) {
		const new_node = await addNode({ name: node_name })

		node_id = new_node.id

		log('SAVE', 'insertNewNode', () => `node_id: ${node_id}`)

		const { rowid: node_rowid } = getNodeRowid().get(node_id) as { rowid: number }

		const node_vector = await getEmbedding(node_name)

		log('SAVE', 'saveNodeVector')

		insertNodeVector().run(BigInt(node_rowid), Buffer.from(new Float32Array(node_vector).buffer))
	}

	await addNodeChunk(node_id, chunk_id)

	return node_id
}

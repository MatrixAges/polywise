import { getEdgeRowid, insertEdgeVector } from '@core/db/prepare'
import { edge } from '@core/db/schema'
import { env } from '@core/env'
import { getEmbedding } from '@core/pipeline'
import { log } from '@core/utils'
import { and, eq } from 'drizzle-orm'

interface Args {
	relation: string
	source_id: string
	target_id: string
}

export default async (args: Args) => {
	const { relation, source_id, target_id } = args

	const [exist_edge] = await env.db
		.select()
		.from(edge)
		.where(and(eq(edge.source_id, source_id), eq(edge.target_id, target_id)))
		.limit(1)

	let edge_id = exist_edge?.id

	log('SAVE', 'getExistEdge', () => `edge_id: ${edge_id}`)

	if (!edge_id) {
		const [new_edge] = await env.db
			.insert(edge)
			.values({ relation, source_id, target_id })
			.returning({ id: edge.id })

		edge_id = new_edge.id

		log('SAVE', 'insertNewEdge', () => `edge_id: ${edge_id}`)

		const { rowid: edge_rowid } = getEdgeRowid().get(edge_id) as { rowid: number }

		const edge_vector = await getEmbedding(relation)

		log('SAVE', 'saveEdgeVector')

		insertEdgeVector().run(BigInt(edge_rowid), Buffer.from(new Float32Array(edge_vector).buffer))
	}

	return edge_id
}

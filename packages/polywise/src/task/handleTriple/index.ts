import { getTriples } from '@core/pipeline'
import { log } from '@core/utils'

import handleTripleEdge from './handleTripleEdge'
import handleTripleNode from './handleTripleNode'

import type { TripleTaskArgs } from '../types'

export default async (args: TripleTaskArgs) => {
	const { chunk_text, chunk_item_id } = args

	log('SAVE', 'getTriples', () => `chunk: ${chunk_text}`)

	const triples = await getTriples(chunk_text, chunk => process.stdout.write(chunk))

	log('SAVE', 'getTriples', () => `triples: ${JSON.stringify(triples)}`)

	for (const triple of triples) {
		const { head, relation, tail } = triple

		if (!head || !relation || !tail) continue

		const head_id = await handleTripleNode({
			node_name: head,
			chunk_id: chunk_item_id
		})

		const tail_id = await handleTripleNode({
			node_name: tail,
			chunk_id: chunk_item_id
		})

		await handleTripleEdge({
			relation,
			source_id: head_id,
			target_id: tail_id
		})
	}
}

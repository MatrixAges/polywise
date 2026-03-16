import { agent, article, chunk, edge, node, node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { getChunks, getEmbedding, getKeywords, getTriples } from '@core/pipeline'
import { getHash, log } from '@core/utils'
import { and, eq } from 'drizzle-orm'

import type { SqliteRow } from '@core/types'

export default async (v: string) => {
	const hash = getHash(v)

	const [exist] = await env.db.select().from(article).where(eq(article.hash, hash)).limit(1)

	if (exist) return exist.id

	const insert_node_vec = env.sqlite.prepare('INSERT INTO vec.node_vec(rowid, vectors) VALUES (?, ?)')
	const insert_edge_vec = env.sqlite.prepare('INSERT INTO vec.edge_vec(rowid, vectors) VALUES (?, ?)')

	const chunks = await getChunks(v)

	log('SAVE', 'getChunks', () => `chunk_length: ${chunks.length}`)

	const [global_agent] = await env.db.select().from(agent).where(eq(agent.name, 'global')).limit(1)
	const agent_id = global_agent.id

	log('SAVE', 'getGlobalAgent', () => `agent_id: ${agent_id}`)

	const [article_item] = await env.db.insert(article).values({ content: v, hash }).returning({ id: article.id })

	log('SAVE', 'insertArticle', () => `article_id: ${article_item.id}`)

	for (let i = 0; i < chunks.length; i++) {
		const item = chunks[i]

		const keywords = await getKeywords(item)

		log('SAVE', 'getKeywords', () => `keywords: ${JSON.stringify(keywords)}`)

		const [chunk_item] = await env.db
			.insert(chunk)
			.values({
				article_id: article_item.id,
				content: item,
				keywords: keywords.map(k => k.word).join(','),
				as_body: chunks.length === 1,
				position: i
			})
			.returning({ id: chunk.id })

		log('SAVE', 'insertChunk', () => `${i} chunk_length: ${item.length}`)

		const { rowid } = env.sqlite.prepare('SELECT rowid FROM chunk WHERE id = ?').get(chunk_item.id) as SqliteRow

		log('SAVE', 'getChunkRowid', () => `chunk_rowid: ${rowid}`)

		const vector = await getEmbedding(item)

		log('SAVE', 'getChunkEmbedding')

		const statement = env.sqlite.prepare('INSERT INTO vec.chunk_vec(rowid, vectors) VALUES (?, ?)')

		statement.run(rowid, Buffer.from(new Float32Array(vector).buffer))

		log('SAVE', 'saveChunkVector')

		const triples = await getTriples(item)

		log('SAVE', 'getTriples', () => `triples: ${JSON.stringify(triples)}`)

		for (const triple of triples) {
			if (!triple.head || !triple.relation || !triple.tail) continue

			let head_id: string
			let tail_id: string
			let edge_id: string

			const [head_node] = await env.db
				.select()
				.from(node)
				.where(and(eq(node.agent_id, agent_id), eq(node.name, triple.head)))
				.limit(1)

			head_id = head_node?.id

			log('SAVE', 'getExistHeadNode', () => `head_id: ${head_id}`)

			if (!head_id) {
				const [head_node_item] = await env.db
					.insert(node)
					.values({ agent_id, name: triple.head })
					.returning({ id: node.id })

				head_id = head_node_item.id

				log('SAVE', 'insertNewHeadNode', () => `head_id: ${head_id}`)

				const { rowid: node_rowid } = env.sqlite
					.prepare('SELECT rowid FROM node WHERE id = ?')
					.get(head_id) as SqliteRow

				const head_vector = await getEmbedding(triple.head)

				log('SAVE', 'saveHeadVector')

				insert_node_vec.run(node_rowid, Buffer.from(new Float32Array(head_vector).buffer))
			}

			await env.db
				.insert(node_chunk)
				.values({ node_id: head_node.id, chunk_id: chunk_item.id })
				.onConflictDoNothing()

			const [tail_node] = await env.db
				.select()
				.from(node)
				.where(and(eq(node.agent_id, agent_id), eq(node.name, triple.tail)))
				.limit(1)

			tail_id = tail_node?.id

			log('SAVE', 'getExistTailNode', () => `tail_id: ${tail_id}`)

			if (!tail_id) {
				const [tail_node_item] = await env.db
					.insert(node)
					.values({ agent_id, name: triple.tail })
					.returning({ id: node.id })

				tail_id = tail_node_item.id

				log('SAVE', 'insertNewTailNode', () => `tail_id: ${tail_id}`)

				const { rowid: node_rowid } = env.sqlite
					.prepare('SELECT rowid FROM node WHERE id = ?')
					.get(tail_id) as SqliteRow

				const tail_vector = await getEmbedding(triple.tail)

				log('SAVE', 'saveTailVector')

				insert_node_vec.run(node_rowid, Buffer.from(new Float32Array(tail_vector).buffer))
			}

			await env.db
				.insert(node_chunk)
				.values({ node_id: tail_node.id, chunk_id: chunk_item.id })
				.onConflictDoNothing()

			const [relation_edge] = await env.db
				.select()
				.from(edge)
				.where(and(eq(edge.source_id, head_node.id), eq(edge.target_id, tail_node.id)))
				.limit(1)

			edge_id = relation_edge?.id

			log('SAVE', 'getExistEdge', () => `edge_id: ${edge_id}`)

			if (!edge_id) {
				const [relation_edge_item] = await env.db
					.insert(edge)
					.values({
						agent_id,
						relation: triple.relation,
						source_id: head_node.id,
						target_id: tail_node.id
					})
					.returning({ id: edge.id })

				edge_id = relation_edge_item.id

				log('SAVE', 'insertNewEdge', () => `edge_id: ${edge_id}`)

				const { rowid: edge_rowid } = env.sqlite
					.prepare('SELECT rowid FROM edge WHERE id = ?')
					.get(edge_id) as SqliteRow

				const edge_vector = await getEmbedding(triple.relation)

				log('SAVE', 'saveEdgeVector')

				insert_edge_vec.run(edge_rowid, Buffer.from(new Float32Array(edge_vector).buffer))
			}
		}
	}

	log('SAVE', 'Done', () => `article_id: ${article_item.id}`)

	return article_item.id
}

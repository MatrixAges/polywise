import { article, chunk } from '@core/db/schema'
import { env } from '@core/env'
import { getChunks, getEmbedding, getKeywords } from '@core/pipeline'
import { getHash, log } from '@core/utils'
import { eq } from 'drizzle-orm'

import { getGlobalAgentId } from '../../common'
import handleTriples from './handleTriples'

import type { SqliteRow } from '@core/types'

export default async (v: string) => {
	const hash = getHash(v)

	const [exist] = await env.db.select().from(article).where(eq(article.hash, hash)).limit(1)

	if (exist) return exist.id

	const agent_id = await getGlobalAgentId()
	const chunks = await getChunks(v)

	log('SAVE', 'getChunks', () => `chunk_length: ${chunks.length}`)

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
				keywords: keywords.join(','),
				is_body: chunks.length === 1,
				position: i
			})
			.returning({ id: chunk.id })

		log('SAVE', 'insertChunk', () => `${i} chunk_length: ${item.length}`)

		const { rowid } = env.sqlite.prepare('SELECT rowid FROM chunk WHERE id = ?').get(chunk_item.id) as SqliteRow

		log('SAVE', 'getChunkRowid', () => `chunk_rowid: ${rowid}`)

		const vector = await getEmbedding(item)

		log('SAVE', 'getChunkEmbedding')

		const statement = env.sqlite.prepare('INSERT INTO vec.chunk_vec(rowid, vectors) VALUES (?, ?)')

		statement.run(BigInt(rowid), Buffer.from(new Float32Array(vector).buffer))

		log('SAVE', 'saveChunkVector')

		await handleTriples({ chunk_text: item, agent_id, chunk_item_id: chunk_item.id })
	}

	log('SAVE', 'Done', () => `article_id: ${article_item.id}`)

	return article_item.id
}

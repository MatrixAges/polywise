import { config } from '@core/config'
import { getChunkRowid, insertChunkVector } from '@core/db/prepare'
import { article, chunk, task } from '@core/db/schema'
import { env } from '@core/env'
import { getChunks, getEmbedding, getKeywords } from '@core/pipeline'
import { getHash, log } from '@core/utils'
import { eq } from 'drizzle-orm'

import { getGlobalAgentId } from '../common'

export default async (v: string) => {
	const hash = getHash(v)
	const enable_triple = Boolean(config.enable_triple)

	const [exist] = await env.db.select().from(article).where(eq(article.hash, hash)).limit(1)
	if (exist) return exist.id

	const agent_id = await getGlobalAgentId()
	const chunks = await getChunks(v)

	log('SAVE', 'getChunks', () => `chunk_length: ${chunks.length}`)

	const [article_item] = await env.db
		.insert(article)
		.values({ content: v, hash, is_tripled: enable_triple })
		.returning({ id: article.id })

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

		const { rowid } = getChunkRowid().get(chunk_item.id) as { rowid: number }

		log('SAVE', 'getChunkRowid', () => `chunk_rowid: ${rowid}`)

		const vector = await getEmbedding(item)

		log('SAVE', 'getChunkEmbedding')

		insertChunkVector().run(BigInt(rowid), Buffer.from(new Float32Array(vector).buffer))

		log('SAVE', 'saveChunkVector')

		if (enable_triple) {
			await env.db.insert(task).values({
				type: 'triple',
				args: { chunk_text: item, agent_id, chunk_item_id: chunk_item.id }
			})
		}
	}

	log('SAVE', 'Done', () => `article_id: ${article_item.id}`)

	return article_item.id
}

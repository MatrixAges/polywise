import { config } from '@core/config'
import { getChunkRowid, insertChunkVector } from '@core/db/prepare'
import { article, chunk, node_chunk, task } from '@core/db/schema'
import { env } from '@core/env'
import { getChunks, getEmbedding, getKeywords } from '@core/pipeline'
import { getHash, log } from '@core/utils'
import { eq } from 'drizzle-orm'

export default async (article_id: string, content: string) => {
	const hash = getHash(content)
	const enable_triple = Boolean(config.enable_triple)

	const [existing_article] = await env.db.select().from(article).where(eq(article.id, article_id)).limit(1)

	if (!existing_article) {
		throw new Error(`Article not found: ${article_id}`)
	}

	const existing_chunks = await env.db.select({ id: chunk.id }).from(chunk).where(eq(chunk.article_id, article_id))

	if (existing_chunks.length > 0) {
		for (const chunk_item of existing_chunks) {
			await env.db.delete(node_chunk).where(eq(node_chunk.chunk_id, chunk_item.id))
		}

		await env.db.delete(chunk).where(eq(chunk.article_id, article_id))
	}

	await env.db
		.update(article)
		.set({ content, hash, is_tripled: enable_triple, updated_at: new Date() })
		.where(eq(article.id, article_id))

	log('SYSTEM', 'updateArticle', () => `article_id: ${article_id}`)

	const chunks = await getChunks(content)

	log('SYSTEM', 'getChunks', () => `chunk_length: ${chunks.length}`)

	for (let i = 0; i < chunks.length; i++) {
		const item = chunks[i]
		const keywords = await getKeywords(item)

		log('SYSTEM', 'getKeywords', () => `keywords: ${JSON.stringify(keywords)}`)

		const [chunk_item] = await env.db
			.insert(chunk)
			.values({
				article_id: article_id,
				content: item,
				keywords: keywords.join(','),
				is_body: chunks.length === 1,
				position: i
			})
			.returning({ id: chunk.id })

		log('SYSTEM', 'insertChunk', () => `${i} chunk_length: ${item.length}`)

		const { rowid } = getChunkRowid().get(chunk_item.id) as { rowid: number }

		log('SYSTEM', 'getChunkRowid', () => `chunk_rowid: ${rowid}`)

		const vector = await getEmbedding(item)

		log('SYSTEM', 'getChunkEmbedding')

		insertChunkVector().run(BigInt(rowid), Buffer.from(new Float32Array(vector).buffer))

		log('SYSTEM', 'saveChunkVector')

		if (enable_triple) {
			await env.db.insert(task).values({
				type: 'triple',
				args: { chunk_text: item, agent_id: existing_article.document_id, chunk_item_id: chunk_item.id }
			})
		}
	}

	log('SYSTEM', 'Done', () => `article_id: ${article_id}`)

	return article_id
}

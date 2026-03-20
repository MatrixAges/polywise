import { article, chunk, node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { log } from '@core/utils'
import { eq } from 'drizzle-orm'

export default async (article_id: string) => {
	const [existing_article] = await env.db.select().from(article).where(eq(article.id, article_id)).limit(1)

	if (!existing_article) {
		throw new Error(`Article not found: ${article_id}`)
	}

	const existing_chunks = await env.db.select({ id: chunk.id }).from(chunk).where(eq(chunk.article_id, article_id))

	log('SYSTEM', 'findChunks', () => `found ${existing_chunks.length} chunks for article ${article_id}`)

	for (const chunk_item of existing_chunks) {
		await env.db.delete(node_chunk).where(eq(node_chunk.chunk_id, chunk_item.id))

		log('SYSTEM', 'deleteNodeChunk', () => `chunk_id: ${chunk_item.id}`)
	}

	await env.db.delete(chunk).where(eq(chunk.article_id, article_id))

	log('SYSTEM', 'deleteChunks', () => `article_id: ${article_id}`)

	await env.db.delete(article).where(eq(article.id, article_id))

	log('SYSTEM', 'deleteArticle', () => `article_id: ${article_id}`)

	return { ok: true }
}

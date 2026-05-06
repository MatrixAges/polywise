import { config } from '@core/config'
import { deleteChunkFts, deleteChunkVector, getChunkRowid, insertChunkFts, insertChunkVector } from '@core/db/prepare'
import { article, chunk, node_chunk } from '@core/db/schema'
import {
	addArticle,
	addChunk,
	getArticle,
	getChunks,
	removeChunks,
	removeNodeChunk,
	setArticle
} from '@core/db/services'
import { getEmbedding, getKeywords, getChunks as getPipelineChunks } from '@core/pipeline'
import { getHash, log } from '@core/utils'
import { eq } from 'drizzle-orm'

import type { Article } from '@core/db/types'

interface ArgsSaveArticle {
	content: string
	for: NonNullable<Article['for']>
	article_id?: string
	scope_type?: 'global' | 'project' | 'agent'
	scope_id?: string | null
	source?: 'agent' | 'superego'
}

export default async (args: ArgsSaveArticle) => {
	const { content, article_id, scope_type = 'global', scope_id = null, source = 'agent' } = args
	const hash = scope_type === 'global' ? getHash(`${args.for}\n${content}`) : null
	const enable_triple = Boolean(config.enable_triple)

	if (!article_id && hash) {
		const exist = await getArticle(eq(article.hash, hash))

		if (exist) return exist.id
	}

	const chunks = await getPipelineChunks(content)

	log('SAVE', 'getChunks', () => `chunk_length: ${chunks.length}`)

	let current_article_id = article_id

	if (current_article_id) {
		const existing_article = await getArticle(eq(article.id, current_article_id))

		if (!existing_article) {
			throw new Error(`Article not found: ${current_article_id}`)
		}

		const existing_chunks = await getChunks({
			where: eq(chunk.article_id, current_article_id)
		})

		if (existing_chunks.length > 0) {
			for (const chunk_item of existing_chunks) {
				const rowid_res = getChunkRowid().get(chunk_item.id) as { rowid: number } | undefined

				if (rowid_res) {
					deleteChunkVector().run(BigInt(rowid_res.rowid))
					deleteChunkFts().run(BigInt(rowid_res.rowid))

					log('SAVE', 'deleteChunkVector', () => `chunk_rowid: ${rowid_res.rowid}`)
				}

				await removeNodeChunk(eq(node_chunk.chunk_id, chunk_item.id))
			}

			await removeChunks(eq(chunk.article_id, current_article_id))
		}

		await setArticle(eq(article.id, current_article_id), {
			content: content,
			for: args.for,
			scope_type,
			scope_id,
			source,
			hash,
			is_tripled: enable_triple,
			updated_at: new Date()
		})

		log('SAVE', 'updateArticle', () => `article_id: ${current_article_id}`)
	} else {
		const article_item = await addArticle({
			content: content,
			for: args.for,
			scope_type,
			scope_id,
			source,
			hash,
			is_tripled: enable_triple
		})

		current_article_id = article_item.id

		log('SAVE', 'insertArticle', () => `article_id: ${current_article_id}`)
	}

	for (let i = 0; i < chunks.length; i++) {
		const item = chunks[i]
		const keywords = await getKeywords(item)

		log('SAVE', 'getKeywords', () => `keywords: ${JSON.stringify(keywords)}`)

		const chunk_item = await addChunk({
			article_id: current_article_id,
			content: item,
			keywords: keywords.join(','),
			is_body: chunks.length === 1,
			position: i
		})

		log('SAVE', 'insertChunk', () => `${i} chunk_length: ${item.length}`)

		const { rowid } = getChunkRowid().get(chunk_item.id) as { rowid: number }

		log('SAVE', 'getChunkRowid', () => `chunk_rowid: ${rowid}`)

		insertChunkFts().run(BigInt(rowid), keywords.join(','))

		log('SAVE', 'insertChunkFts', () => `chunk_rowid: ${rowid}`)

		const vector = await getEmbedding(item)

		log('SAVE', 'getChunkEmbedding')

		insertChunkVector().run(BigInt(rowid), Buffer.from(new Float32Array(vector).buffer))

		log('SAVE', 'saveChunkVector')

		if (enable_triple) {
			// Triple parsing now handled synchronously or via other means
		}
	}

	log('SAVE', 'Done', () => `article_id: ${current_article_id}`)

	return current_article_id
}

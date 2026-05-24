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

import { readPipelineStore, removePipelineTask, setPipelineTask } from './pipelineStore'

import type { Article } from '@core/db/types'

interface ArgsSaveArticle {
	title?: string | null
	content: string
	for: NonNullable<Article['for']>
	article_id?: string
	scope_type?: 'global' | 'project' | 'agent'
	scope_id?: string | null
	source?: 'agent' | 'superego'
	exec_pipeline?: boolean
}

let pipeline_processing = false
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error)) || 'Unknown error'

const clearArticleChunks = async (article_id: string) => {
	const existing_chunks = await getChunks({
		where: eq(chunk.article_id, article_id)
	})

	if (existing_chunks.length === 0) return

	for (const chunk_item of existing_chunks) {
		const rowid_res = getChunkRowid().get(chunk_item.id) as { rowid: number } | undefined

		if (rowid_res) {
			deleteChunkVector().run(BigInt(rowid_res.rowid))
			deleteChunkFts().run(BigInt(rowid_res.rowid))

			log('SAVE', 'deleteChunkVector', () => `chunk_rowid: ${rowid_res.rowid}`)
		}

		await removeNodeChunk(eq(node_chunk.chunk_id, chunk_item.id))
	}

	await removeChunks(eq(chunk.article_id, article_id))
}

const runArticlePipeline = async (article_id: string, content: string) => {
	const chunks = await getPipelineChunks(content)

	log('SAVE', 'getChunks', () => `chunk_length: ${chunks.length}`)

	for (let i = 0; i < chunks.length; i++) {
		const item = chunks[i]
		const keywords = await getKeywords(item)

		log('SAVE', 'getKeywords', () => `keywords: ${JSON.stringify(keywords)}`)

		const chunk_item = await addChunk({
			article_id,
			content: item,
			keywords: keywords.join(','),
			is_body: chunks.length === 1,
			position: i
		})

		log('SAVE', 'insertChunk', () => `${i} chunk_length: ${item.length}`)

		const { rowid } = getChunkRowid().get(chunk_item.id) as { rowid: number }

		log('SAVE', 'getChunkRowid', () => `chunk_rowid: ${rowid}`)

		// Chunk rowids can be reused while external FTS/vector tables still contain stale rows.
		deleteChunkFts().run(BigInt(rowid))
		insertChunkFts().run(BigInt(rowid), keywords.join(','))

		log('SAVE', 'insertChunkFts', () => `chunk_rowid: ${rowid}`)

		const vector = await getEmbedding(item)

		log('SAVE', 'getChunkEmbedding')

		deleteChunkVector().run(BigInt(rowid))
		insertChunkVector().run(BigInt(rowid), Buffer.from(new Float32Array(vector).buffer))

		log('SAVE', 'saveChunkVector')
	}
}

const processPipelineTask = async (article_id: string, created_at: string) => {
	const current_article = await getArticle(eq(article.id, article_id))

	if (!current_article) {
		await removePipelineTask(article_id, { archive: false })

		return
	}

	if (!current_article.content.trim()) {
		await setArticle(eq(article.id, article_id), {
			is_pipelined: true,
			updated_at: new Date()
		})
		await removePipelineTask(article_id, {
			done_at: new Date().toISOString(),
			status: 'done'
		})

		return
	}

	try {
		await clearArticleChunks(article_id)
		await runArticlePipeline(article_id, current_article.content)

		await setArticle(eq(article.id, article_id), {
			is_pipelined: true,
			updated_at: new Date()
		})

		await removePipelineTask(article_id, {
			done_at: new Date().toISOString(),
			status: 'done'
		})
	} catch (error) {
		await clearArticleChunks(article_id)

		await setPipelineTask(article_id, {
			created_at,
			status: 'error',
			done_at: new Date().toISOString(),
			error_message: getErrorMessage(error)
		})

		throw error
	}
}

const kickPipelineWorker = () => {
	queueMicrotask(async () => {
		if (pipeline_processing) return

		pipeline_processing = true

		try {
			while (true) {
				const store = await readPipelineStore()
				const next_task = Object.entries(store)
					.filter(([, task]) => task.status === 'running')
					.sort(
						(a, b) => new Date(a[1].created_at).getTime() - new Date(b[1].created_at).getTime()
					)[0]

				if (!next_task) return

				try {
					await processPipelineTask(next_task[0], next_task[1].created_at)
				} catch (error) {
					log('SAVE', 'pipelineWorkerError', () =>
						error instanceof Error ? error.message : String(error)
					)
				}
			}
		} finally {
			pipeline_processing = false
		}
	})
}

export default async (args: ArgsSaveArticle) => {
	const { title, content, article_id, scope_type = 'global', scope_id = null, source = 'agent' } = args
	const hash = scope_type === 'global' ? getHash(`${args.for}\n${content}`) : null
	const exec_pipeline = Boolean(args.exec_pipeline)
	const has_content = content.trim().length > 0

	if (!article_id && hash) {
		const exist = await getArticle(eq(article.hash, hash))

		if (exist && (!exec_pipeline || exist.is_pipelined)) return exist.id
	}

	let current_article_id = article_id || null

	if (!current_article_id && hash) {
		const exist = await getArticle(eq(article.hash, hash))

		if (exist) current_article_id = exist.id
	}

	if (current_article_id) {
		const existing_article = await getArticle(eq(article.id, current_article_id))

		if (!existing_article) {
			throw new Error(`Article not found: ${current_article_id}`)
		}

		await clearArticleChunks(current_article_id)

		await setArticle(eq(article.id, current_article_id), {
			title: title || null,
			content: content,
			for: args.for,
			scope_type,
			scope_id,
			source,
			hash,
			is_pipelined: false,
			updated_at: new Date()
		})

		log('SAVE', 'updateArticle', () => `article_id: ${current_article_id}`)
	} else {
		const article_item = await addArticle({
			title: title || null,
			content: content,
			for: args.for,
			scope_type,
			scope_id,
			source,
			hash,
			is_pipelined: false
		})

		current_article_id = article_item.id

		log('SAVE', 'insertArticle', () => `article_id: ${current_article_id}`)
	}

	if (!has_content) {
		if (exec_pipeline) {
			await setArticle(eq(article.id, current_article_id), {
				is_pipelined: true,
				updated_at: new Date()
			})
		}

		log('SAVE', 'skipChunking', () => `article_id: ${current_article_id}`)

		return current_article_id
	}

	if (!exec_pipeline) {
		log('SAVE', 'skipPipeline', () => `article_id: ${current_article_id}`)

		return current_article_id
	}

	const created_at = new Date().toISOString()

	await setPipelineTask(current_article_id, {
		created_at,
		status: 'running',
		done_at: null,
		error_message: null
	})
	kickPipelineWorker()

	log('SAVE', 'Queued', () => `article_id: ${current_article_id}`)

	return current_article_id
}

kickPipelineWorker()

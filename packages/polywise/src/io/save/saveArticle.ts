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

import {
	assertPipelineTaskNotCancelled,
	isPipelineTaskCancelledError,
	patchPipelineTask,
	readPipelineStore,
	removePipelineTask,
	setPipelineTask
} from './pipelineStore'

import type { Article, ArticleInsert } from '@core/db/types'

interface ArgsSaveArticle {
	title?: string | null
	content: string
	for: NonNullable<Article['for']>
	article_id?: string
	scope_type?: 'global' | 'project' | 'agent'
	scope_id?: string | null
	source?: 'agent' | 'superego' | 'pthink'
	metadata?: ArticleInsert['metadata']
	exec_pipeline?: boolean
	await_graph_sync?: boolean
}

export interface GraphBackfillMetadata {
	status: 'pipeline_pending' | 'graph_pending' | 'done'
	synced_at: string | null
	article_updated_at: string
	triple_count: number | null
}

let pipeline_processing = false
const pipeline_worker_concurrency = 2
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error)) || 'Unknown error'

export const getArticleMetadataObject = (metadata: unknown) => {
	if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
		return {} as Record<string, unknown>
	}

	return metadata as Record<string, unknown>
}

export const getUpdatedAtToken = (updated_at: Date | null | undefined) => {
	return updated_at ? String(Math.floor(updated_at.getTime() / 1000)) : ''
}

export const getArticleUpdatedAtToken = (article_item: Pick<Article, 'updated_at'>) => {
	return getUpdatedAtToken(article_item.updated_at)
}

const isGraphStatusText = (value?: string | null) => {
	return typeof value === 'string' && value.startsWith('Extracting graph')
}

export const createGraphBackfillMetadata = (args: {
	status: GraphBackfillMetadata['status']
	article_updated_at: string
	triple_count?: number | null
}) => {
	const { status, article_updated_at, triple_count = null } = args

	return {
		status,
		synced_at: status === 'done' ? new Date().toISOString() : null,
		article_updated_at,
		triple_count
	} satisfies GraphBackfillMetadata
}

export const mergeGraphBackfillMetadata = (args: {
	metadata: unknown
	status: GraphBackfillMetadata['status']
	article_updated_at: string
	triple_count?: number | null
}) => {
	const { metadata, status, article_updated_at, triple_count } = args
	const metadata_object = getArticleMetadataObject(metadata)

	return {
		...metadata_object,
		graph_backfill: createGraphBackfillMetadata({
			status,
			article_updated_at,
			triple_count
		})
	}
}

export const getArticleGraphBackfill = (metadata: unknown) => {
	const metadata_object = getArticleMetadataObject(metadata)
	const graph_value = metadata_object.graph_backfill

	if (!graph_value || typeof graph_value !== 'object' || Array.isArray(graph_value)) {
		return null
	}

	const graph_metadata = graph_value as Partial<GraphBackfillMetadata>

	if (
		(graph_metadata.status !== 'pipeline_pending' &&
			graph_metadata.status !== 'graph_pending' &&
			graph_metadata.status !== 'done') ||
		(graph_metadata.synced_at !== null && typeof graph_metadata.synced_at !== 'string') ||
		typeof graph_metadata.article_updated_at !== 'string' ||
		(graph_metadata.triple_count !== null && typeof graph_metadata.triple_count !== 'number')
	) {
		return null
	}

	return graph_metadata as GraphBackfillMetadata
}

export const isArticleChunkPipelineReady = (article_item: Pick<Article, 'metadata' | 'updated_at'>) => {
	const graph_metadata = getArticleGraphBackfill(article_item.metadata)

	if (!graph_metadata) {
		return false
	}

	return (
		(graph_metadata.status === 'graph_pending' || graph_metadata.status === 'done') &&
		graph_metadata.article_updated_at === getArticleUpdatedAtToken(article_item)
	)
}

export const isArticleGraphBackfillDoneCurrent = (
	article_item: Pick<Article, 'metadata' | 'updated_at' | 'is_pipelined'>
) => {
	const graph_metadata = getArticleGraphBackfill(article_item.metadata)

	if (!article_item.is_pipelined || !graph_metadata) {
		return false
	}

	return (
		graph_metadata.status === 'done' &&
		graph_metadata.article_updated_at === getArticleUpdatedAtToken(article_item)
	)
}

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

const runArticlePipeline = async (args: { article_id: string; content: string; created_at: string }) => {
	const { article_id, content, created_at } = args
	const chunks = await getPipelineChunks(content)

	log('SAVE', 'getChunks', () => `chunk_length: ${chunks.length}`)

	for (let i = 0; i < chunks.length; i++) {
		assertPipelineTaskNotCancelled({ article_id, created_at })

		const item = chunks[i]

		if (!item.trim()) {
			log('SAVE', 'skipEmptyChunk', () => ({
				article_id,
				chunk_index: i
			}))

			continue
		}

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
		const next_updated_at = new Date()
		const has_graph_backfill = Boolean(getArticleGraphBackfill(current_article.metadata))

		await setArticle(eq(article.id, article_id), {
			...(has_graph_backfill
				? {
						is_pipelined: false,
						metadata: mergeGraphBackfillMetadata({
							metadata: current_article.metadata,
							status: 'graph_pending',
							article_updated_at: getUpdatedAtToken(next_updated_at)
						})
					}
				: {
						is_pipelined: true
					}),
			updated_at: next_updated_at
		})

		if (has_graph_backfill) {
			await patchPipelineTask({
				article_id,
				task: {
					status: 'running',
					done_at: null,
					error_message: null,
					status_text: 'Extracting graph'
				}
			})
		} else {
			await removePipelineTask(article_id, {
				done_at: new Date().toISOString(),
				status: 'done'
			})
		}

		return
	}

	try {
		await clearArticleChunks(article_id)
		await runArticlePipeline({
			article_id,
			content: current_article.content,
			created_at
		})
		const next_updated_at = new Date()
		const has_graph_backfill = Boolean(getArticleGraphBackfill(current_article.metadata))

		await setArticle(eq(article.id, article_id), {
			...(has_graph_backfill
				? {
						is_pipelined: false,
						metadata: mergeGraphBackfillMetadata({
							metadata: current_article.metadata,
							status: 'graph_pending',
							article_updated_at: getUpdatedAtToken(next_updated_at)
						})
					}
				: {
						is_pipelined: true
					}),
			updated_at: next_updated_at
		})

		if (has_graph_backfill) {
			await patchPipelineTask({
				article_id,
				task: {
					status: 'running',
					done_at: null,
					error_message: null,
					status_text: 'Extracting graph'
				}
			})
		} else {
			await removePipelineTask(article_id, {
				done_at: new Date().toISOString(),
				status: 'done'
			})
		}
	} catch (error) {
		await clearArticleChunks(article_id)

		if (isPipelineTaskCancelledError(error)) {
			await removePipelineTask(article_id, { archive: false })

			return
		}

		await setPipelineTask(article_id, {
			created_at,
			status: 'error',
			done_at: new Date().toISOString(),
			error_message: getErrorMessage(error),
			status_text: null
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
				const running_tasks = Object.entries(store)
					.filter(([, task]) => task.status === 'running' && !isGraphStatusText(task.status_text))
					.sort((a, b) => new Date(a[1].created_at).getTime() - new Date(b[1].created_at).getTime())
				const available_slots = Math.max(0, pipeline_worker_concurrency - running_tasks.length)
				const queued_tasks = Object.entries(store)
					.filter(([, task]) => task.status === 'queued')
					.sort((a, b) => new Date(a[1].created_at).getTime() - new Date(b[1].created_at).getTime())
					.slice(0, available_slots)

				if (running_tasks.length === 0 && queued_tasks.length === 0) return

				if (queued_tasks.length > 0) {
					await Promise.all(
						queued_tasks.map(([article_id, task]) =>
							setPipelineTask(article_id, {
								created_at: task.created_at,
								status: 'running',
								done_at: null,
								error_message: null,
								status_text: 'Embedding chunks'
							})
						)
					)
				}

				const next_tasks = [...running_tasks, ...queued_tasks]

				await Promise.all(
					next_tasks.map(async ([article_id, task]) => {
						try {
							await processPipelineTask(article_id, task.created_at)
						} catch (error) {
							log('SAVE', 'pipelineWorkerError', () =>
								error instanceof Error ? error.message : String(error)
							)
						}
					})
				)
			}
		} finally {
			pipeline_processing = false
		}
	})
}

export default async (args: ArgsSaveArticle) => {
	const { title, content, article_id, scope_type = 'global', scope_id = null, source = 'agent' } = args
	const hash = getHash(`${scope_type}\n${scope_id || ''}\n${args.for}\n${content}`)
	const exec_pipeline = Boolean(args.exec_pipeline)
	const await_graph_sync = Boolean(args.await_graph_sync)
	const has_content = content.trim().length > 0

	if (!article_id && hash && args.metadata === undefined) {
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

		const existing_metadata =
			existing_article.metadata &&
			typeof existing_article.metadata === 'object' &&
			!Array.isArray(existing_article.metadata)
				? existing_article.metadata
				: {}
		const next_metadata =
			args.metadata === undefined
				? undefined
				: {
						...existing_metadata,
						...args.metadata
					}
		const next_updated_at = new Date()
		const next_metadata_with_graph =
			exec_pipeline && await_graph_sync
				? mergeGraphBackfillMetadata({
						metadata: next_metadata ?? existing_metadata,
						status: 'pipeline_pending',
						article_updated_at: getUpdatedAtToken(next_updated_at)
					})
				: next_metadata

		await clearArticleChunks(current_article_id)

		await setArticle(eq(article.id, current_article_id), {
			title: title || null,
			content: content,
			for: args.for,
			scope_type,
			scope_id,
			source,
			hash,
			...(next_metadata_with_graph === undefined ? {} : { metadata: next_metadata_with_graph }),
			is_pipelined: false,
			updated_at: next_updated_at
		})

		log('SAVE', 'updateArticle', () => `article_id: ${current_article_id}`)
	} else {
		const next_created_at = new Date().toISOString()
		const article_item = await addArticle({
			title: title || null,
			content: content,
			for: args.for,
			scope_type,
			scope_id,
			source,
			hash,
			...((exec_pipeline && await_graph_sync) || args.metadata !== undefined
				? {
						metadata:
							exec_pipeline && await_graph_sync
								? mergeGraphBackfillMetadata({
										metadata: args.metadata,
										status: 'pipeline_pending',
										article_updated_at: getUpdatedAtToken(
											new Date(next_created_at)
										)
									})
								: args.metadata
					}
				: {}),
			is_pipelined: false
		})

		current_article_id = article_item.id

		log('SAVE', 'insertArticle', () => `article_id: ${current_article_id}`)
	}

	if (!has_content) {
		if (exec_pipeline) {
			const next_updated_at = new Date()

			await setArticle(eq(article.id, current_article_id), {
				...(await_graph_sync
					? {
							is_pipelined: false,
							metadata: mergeGraphBackfillMetadata({
								metadata: (await getArticle(eq(article.id, current_article_id)))
									?.metadata,
								status: 'graph_pending',
								article_updated_at: getUpdatedAtToken(next_updated_at)
							})
						}
					: {
							is_pipelined: true
						}),
				updated_at: next_updated_at
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
		status: 'queued',
		done_at: null,
		error_message: null,
		status_text: 'Queued'
	})
	kickPipelineWorker()

	log('SAVE', 'Queued', () => `article_id: ${current_article_id}`)

	return current_article_id
}

kickPipelineWorker()

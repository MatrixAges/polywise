import {
	deleteEdgeFts,
	deleteNodeFts,
	getEdgeRowid,
	getNodeRowid,
	insertEdgeFts,
	insertNodeFts
} from '@core/db/prepare'
import { agent, article, chunk, edge, edge_article, node, node_chunk } from '@core/db/schema'
import {
	addEdge,
	addNode,
	assertAgentWritableForKnowledge,
	getAgent,
	getArticle,
	getArticles,
	getChunks,
	getEdge,
	getNode,
	setArticle
} from '@core/db/services'
import { addEdgeArticle, addNodeChunk } from '@core/db/services/externals'
import { env } from '@core/env'
import { saveArticle } from '@core/io'
import {
	assertPipelineTaskNotCancelled,
	getPipelineTask,
	isPipelineTaskCancelledError,
	patchPipelineTask,
	readPipelineStore,
	removePipelineTask,
	setPipelineTask
} from '@core/io/save/pipelineStore'
import {
	getArticleMetadataObject,
	getUpdatedAtToken,
	isArticleGraphBackfillDoneCurrent,
	isArticleChunkPipelineReady as isSavedArticleChunkPipelineReady
} from '@core/io/save/saveArticle'
import { getTriples } from '@core/pipeline'
import { emitPipelineRefresh } from '@core/rpc/pipeline/emitter'
import { log } from '@core/utils'
import { and, asc, eq, sql } from 'drizzle-orm'

import type { Article } from '@core/db'

const AGENT_ARTICLE_PIPELINE_WAIT_MS = 10 * 60_000
const AGENT_ARTICLE_PIPELINE_POLL_MS = 250
const AGENT_TRIPLE_EXTRACTION_TIMEOUT_MS = 10 * 60_000
const agent_article_extract_tasks = new Map<string, Promise<void>>()
const agent_article_pipeline_batch_running_agents = new Set<string>()
const agent_article_pipeline_batch_tasks = new Map<string, Promise<void>>()

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const normalizeTripleText = (value: string) => value.replace(/\s+/g, ' ').trim()
const writeNodeTextIndex = (args: { node_id: string; name: string }) => {
	const row = getNodeRowid().get(args.node_id) as { rowid: number } | undefined

	if (row) {
		deleteNodeFts().run(BigInt(row.rowid))
		insertNodeFts().run(BigInt(row.rowid), args.name)
	}
}

const writeEdgeTextIndex = (args: { edge_id: string; source_name: string; relation: string; target_name: string }) => {
	const row = getEdgeRowid().get(args.edge_id) as { rowid: number } | undefined

	if (row) {
		deleteEdgeFts().run(BigInt(row.rowid))
		insertEdgeFts().run(BigInt(row.rowid), `${args.source_name} ${args.relation} ${args.target_name}`.trim())
	}
}

const isPipelineWaitTimeoutError = (error: unknown) =>
	error instanceof Error && error.message.startsWith('Timed out while waiting for article pipeline:')
const isTripleExtractionTimeoutError = (error: unknown) =>
	error instanceof Error && error.message.startsWith('Timed out while extracting triples:')

const isAgentGraphSyncCurrent = (article_item: Pick<Article, 'is_pipelined' | 'metadata' | 'updated_at'>) => {
	return isArticleGraphBackfillDoneCurrent(article_item)
}

const isAgentChunkPipelineReady = (article_item: Pick<Article, 'metadata' | 'updated_at'>) => {
	return isSavedArticleChunkPipelineReady(article_item)
}

const setAgentGraphMetadata = async (args: { article_item: Article; triple_count: number }) => {
	const { article_item, triple_count } = args
	const metadata_object = getArticleMetadataObject(article_item.metadata)
	const article_updated_at = article_item.updated_at || new Date()

	await setArticle(eq(article.id, article_item.id), {
		metadata: {
			...metadata_object,
			graph_backfill: {
				status: 'done',
				synced_at: new Date().toISOString(),
				article_updated_at: getUpdatedAtToken(article_updated_at),
				triple_count
			}
		},
		is_pipelined: true,
		updated_at: article_updated_at
	})
}

const setGraphPipelineStatusText = async (args: { article_id: string; status_text: string }) => {
	await patchPipelineTask({
		article_id: args.article_id,
		task: {
			status: 'running',
			done_at: null,
			error_message: null,
			status_text: args.status_text
		}
	})
}

const ensureAgentExists = async (agent_id: string) => {
	const agent_item = await getAgent(eq(agent.id, agent_id))

	if (!agent_item) {
		throw new Error(`Agent not found: ${agent_id}`)
	}

	return agent_item
}

const waitForArticlePipeline = async (article_id: string) => {
	const deadline = Date.now() + AGENT_ARTICLE_PIPELINE_WAIT_MS

	while (Date.now() < deadline) {
		const current_article = await getArticle(eq(article.id, article_id))
		const current_chunks = await getChunks({
			where: eq(chunk.article_id, article_id),
			orderBy: asc(chunk.position)
		})
		const pipeline_task = (await readPipelineStore())[article_id]

		if (pipeline_task?.status === 'error') {
			throw new Error(pipeline_task.error_message || `Article pipeline failed: ${article_id}`)
		}

		if (current_article?.is_pipelined || (current_article && isAgentChunkPipelineReady(current_article))) {
			return current_chunks
		}

		await sleep(AGENT_ARTICLE_PIPELINE_POLL_MS)
	}

	throw new Error(`Timed out while waiting for article pipeline: ${article_id}`)
}

const ensureAgentNode = async (agent_id: string, name: string) => {
	const normalized_name = normalizeTripleText(name)

	if (!normalized_name) {
		return null
	}

	const existing = await getNode(and(eq(node.agent_id, agent_id), eq(node.name, normalized_name)))

	if (existing) {
		return existing
	}

	const inserted = await addNode({
		agent_id,
		name: normalized_name
	})

	writeNodeTextIndex({ node_id: inserted.id, name: normalized_name })

	return inserted
}

const ensureAgentEdge = async (args: {
	agent_id: string
	source_id: string
	target_id: string
	source_name: string
	target_name: string
	relation: string
}) => {
	const { agent_id, source_id, target_id, source_name, target_name, relation } = args
	const normalized_relation = normalizeTripleText(relation)

	if (!normalized_relation) {
		return null
	}

	const existing = await getEdge(
		and(eq(edge.agent_id, agent_id), eq(edge.source_id, source_id), eq(edge.target_id, target_id))
	)

	if (existing) {
		return existing
	}

	const inserted = await addEdge({
		agent_id,
		source_id,
		target_id,
		relation: normalized_relation
	})

	writeEdgeTextIndex({
		edge_id: inserted.id,
		source_name,
		target_name,
		relation: normalized_relation
	})

	return inserted
}

const findRelatedChunks = (content_chunks: Awaited<ReturnType<typeof getChunks>>, entity_names: Array<string>) => {
	const normalized_entities = entity_names
		.map(item => item.toLowerCase())
		.filter(Boolean)
		.filter((item, index, list) => list.indexOf(item) === index)

	if (normalized_entities.length === 0) {
		return content_chunks.slice(0, 1)
	}

	const matched_chunks = content_chunks.filter(chunk_item => {
		const text = chunk_item.content?.toLowerCase() ?? ''

		return normalized_entities.some(entity => text.includes(entity))
	})

	return matched_chunks.length > 0 ? matched_chunks : content_chunks.slice(0, 1)
}

const linkNodesToChunks = async (
	node_ids: Array<string>,
	content_chunks: Awaited<ReturnType<typeof getChunks>>,
	entity_names: Array<string>
) => {
	if (node_ids.length === 0 || content_chunks.length === 0) {
		return
	}

	const target_chunks = findRelatedChunks(content_chunks, entity_names)
	const seen_pairs = new Set<string>()

	for (const node_id of node_ids) {
		for (const chunk_item of target_chunks) {
			const pair_key = `${node_id}:${chunk_item.id}`

			if (seen_pairs.has(pair_key)) {
				continue
			}

			seen_pairs.add(pair_key)
			await addNodeChunk(node_id, chunk_item.id).catch(() => null)
		}
	}
}

const withTimeout = async <T>(args: { task: Promise<T>; timeout_ms: number; error_message: string }) => {
	const { task, timeout_ms, error_message } = args

	return Promise.race([
		task,
		new Promise<T>((_resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error(error_message))
			}, timeout_ms)

			void task.finally(() => clearTimeout(timer))
		})
	])
}

const getChunkTextsForTripleExtraction = (
	content_chunks: Awaited<ReturnType<typeof getChunks>>,
	fallback_content: string
) => {
	const chunk_texts = content_chunks.map(item => item.content?.trim() ?? '').filter(Boolean)

	if (chunk_texts.length > 0) {
		return chunk_texts
	}

	return fallback_content.trim() ? [fallback_content.trim()] : []
}

const extractTriplesFromChunks = async (args: {
	article_id: string
	content: string
	content_chunks: Awaited<ReturnType<typeof getChunks>>
}) => {
	const { article_id, content, content_chunks } = args
	const started_at = Date.now()
	const chunk_texts = getChunkTextsForTripleExtraction(content_chunks, content)
	const triple_map = new Map<string, { head: string; relation: string; tail: string }>()
	let current_index = 0

	for (const chunk_text of chunk_texts) {
		current_index += 1
		await setGraphPipelineStatusText({
			article_id,
			status_text: `Extracting triples ${current_index}/${chunk_texts.length}`
		})

		const remaining_ms = AGENT_TRIPLE_EXTRACTION_TIMEOUT_MS - (Date.now() - started_at)

		if (remaining_ms <= 0) {
			throw new Error(`Timed out while extracting triples: ${article_id}`)
		}

		const chunk_triples = await withTimeout({
			task: getTriples(chunk_text),
			timeout_ms: remaining_ms,
			error_message: `Timed out while extracting triples: ${article_id}`
		})

		for (const triple of chunk_triples) {
			const head_name = normalizeTripleText(triple.head)
			const tail_name = normalizeTripleText(triple.tail)
			const relation = normalizeTripleText(triple.relation)

			if (!head_name || !tail_name || !relation) {
				continue
			}

			const triple_key = `${head_name}\n${relation}\n${tail_name}`

			if (!triple_map.has(triple_key)) {
				triple_map.set(triple_key, {
					head: head_name,
					relation,
					tail: tail_name
				})
			}
		}
	}

	return Array.from(triple_map.values())
}

export const pruneAgentGraph = async (agent_id: string) => {
	const orphan_edges = await env.db
		.select({ id: edge.id })
		.from(edge)
		.where(
			and(
				eq(edge.agent_id, agent_id),
				sql`not exists (select 1 from ${edge_article} ea where ea.edge_id = ${edge.id})`
			)
		)

	for (const item of orphan_edges) {
		const row = getEdgeRowid().get(item.id) as { rowid: number } | undefined

		if (row) {
			deleteEdgeFts().run(BigInt(row.rowid))
		}
	}

	await env.db
		.delete(edge)
		.where(
			and(
				eq(edge.agent_id, agent_id),
				sql`not exists (select 1 from ${edge_article} ea where ea.edge_id = ${edge.id})`
			)
		)

	const orphan_nodes = await env.db
		.select({ id: node.id })
		.from(node)
		.where(
			and(
				eq(node.agent_id, agent_id),
				sql`not exists (select 1 from ${node_chunk} nc where nc.node_id = ${node.id})`,
				sql`not exists (select 1 from ${edge} e where e.source_id = ${node.id} or e.target_id = ${node.id})`
			)
		)

	for (const item of orphan_nodes) {
		const row = getNodeRowid().get(item.id) as { rowid: number } | undefined

		if (row) {
			deleteNodeFts().run(BigInt(row.rowid))
		}
	}

	await env.db
		.delete(node)
		.where(
			and(
				eq(node.agent_id, agent_id),
				sql`not exists (select 1 from ${node_chunk} nc where nc.node_id = ${node.id})`,
				sql`not exists (select 1 from ${edge} e where e.source_id = ${node.id} or e.target_id = ${node.id})`
			)
		)
}

const clearAgentArticleGraph = async (agent_id: string, article_id: string) => {
	await env.db.delete(edge_article).where(eq(edge_article.article_id, article_id))
	await pruneAgentGraph(agent_id)
}

const isPendingAgentPrivateArticle = (article_item: Article) => {
	if (!article_item.is_pipelined) {
		return true
	}

	return !isAgentGraphSyncCurrent(article_item)
}

const getAgentPrivateArticlesForPipeline = async (agent_id: string) => {
	return getArticles({
		where: and(eq(article.scope_type, 'agent'), eq(article.scope_id, agent_id)),
		orderBy: [asc(article.created_at), asc(article.id)]
	})
}

const getNextPendingAgentPrivateArticle = async (args: { agent_id: string; exclude_article_ids?: Array<string> }) => {
	const { agent_id, exclude_article_ids = [] } = args
	const pipeline_store = await readPipelineStore()
	const private_articles = await getAgentPrivateArticlesForPipeline(agent_id)
	const pending_articles = private_articles.filter(isPendingAgentPrivateArticle)
	const errored_article_ids = Object.entries(pipeline_store)
		.filter(([, task]) => task.status === 'error')
		.map(([article_id]) => article_id)
	const filtered_error_ids = errored_article_ids.filter(article_id => !exclude_article_ids.includes(article_id))
	const filtered_exclude_ids = exclude_article_ids.filter(Boolean)

	if (filtered_error_ids.length > 0) {
		const errored_article =
			pending_articles.find(
				item => filtered_error_ids.includes(item.id) && !filtered_exclude_ids.includes(item.id)
			) || null

		if (errored_article) {
			return errored_article
		}
	}

	return pending_articles.find(item => !filtered_exclude_ids.includes(item.id)) || null
}

const getPendingAgentPrivateArticleCount = async (agent_id: string) => {
	const private_articles = await getAgentPrivateArticlesForPipeline(agent_id)

	return private_articles.filter(isPendingAgentPrivateArticle).length
}

const runAgentArticleExtractTask = (args: { agent_id: string; article_id: string }) => {
	const previous_task = agent_article_extract_tasks.get(args.article_id) || Promise.resolve()

	const task = previous_task
		.catch(() => null)
		.then(async () => {
			const content_chunks = await waitForArticlePipeline(args.article_id)
			const current_article = await getArticle(eq(article.id, args.article_id))
			const created_at = (await getPipelineTask(args.article_id))?.created_at ?? null
			const content = current_article?.content?.trim() ?? ''

			if (!content) {
				await clearAgentArticleGraph(args.agent_id, args.article_id)
				if (current_article) {
					await setAgentGraphMetadata({
						article_item: current_article,
						triple_count: 0
					})

					await removePipelineTask(args.article_id, {
						done_at: new Date().toISOString(),
						status: 'done'
					})
				}
				return
			}

			await setGraphPipelineStatusText({
				article_id: args.article_id,
				status_text: `Extracting triples 0/${content_chunks.length || 1}`
			})
			const triples = await extractTriplesFromChunks({
				article_id: args.article_id,
				content,
				content_chunks
			})
			await setGraphPipelineStatusText({
				article_id: args.article_id,
				status_text: 'Writing graph'
			})
			await clearAgentArticleGraph(args.agent_id, args.article_id)

			for (const triple of triples) {
				assertPipelineTaskNotCancelled({ article_id: args.article_id, created_at })

				const head_name = normalizeTripleText(triple.head)
				const tail_name = normalizeTripleText(triple.tail)
				const relation = normalizeTripleText(triple.relation)

				if (!head_name || !tail_name || !relation) {
					continue
				}

				const [head_node, tail_node] = await Promise.all([
					ensureAgentNode(args.agent_id, head_name),
					ensureAgentNode(args.agent_id, tail_name)
				])

				if (!head_node || !tail_node) {
					continue
				}

				const edge_item = await ensureAgentEdge({
					agent_id: args.agent_id,
					source_id: head_node.id,
					target_id: tail_node.id,
					source_name: head_name,
					target_name: tail_name,
					relation
				})

				if (edge_item) {
					await addEdgeArticle(edge_item.id, args.article_id)
				}

				await linkNodesToChunks([head_node.id, tail_node.id], content_chunks, [head_name, tail_name])
			}

			if (current_article) {
				await setAgentGraphMetadata({
					article_item: current_article,
					triple_count: triples.length
				})
				await removePipelineTask(args.article_id, {
					done_at: new Date().toISOString(),
					status: 'done'
				})
			}
		})

	agent_article_extract_tasks.set(args.article_id, task)

	void task
		.catch((error: unknown) => {
			if (isPipelineTaskCancelledError(error)) {
				void removePipelineTask(args.article_id, { archive: false })

				return
			}

			void patchPipelineTask({
				article_id: args.article_id,
				task: {
					status: 'error',
					done_at: new Date().toISOString(),
					error_message: error instanceof Error ? error.message : String(error),
					status_text: null
				}
			})

			log('SAVE', 'agentArticleExtractTaskError', () => ({
				agent_id: args.agent_id,
				article_id: args.article_id,
				error: error instanceof Error ? error.message : String(error)
			}))
		})
		.finally(() => {
			if (agent_article_extract_tasks.get(args.article_id) === task) {
				agent_article_extract_tasks.delete(args.article_id)
			}
		})

	return task
}

const extractAgentPrivateArticle = async (args: { agent_id: string; article_id: string }) => {
	const current_article = await getArticle(eq(article.id, args.article_id))

	if (!current_article || current_article.scope_type !== 'agent' || current_article.scope_id !== args.agent_id) {
		throw new Error(`Agent private article not found: ${args.article_id}`)
	}

	if (isAgentGraphSyncCurrent(current_article)) {
		return
	}

	const running_extract_task = agent_article_extract_tasks.get(current_article.id)

	if (running_extract_task) {
		await running_extract_task

		return
	}

	if (current_article.is_pipelined) {
		await runAgentArticleExtractTask({
			agent_id: args.agent_id,
			article_id: current_article.id
		})

		return
	}

	const pipeline_task = (await readPipelineStore())[current_article.id]

	if (pipeline_task?.status === 'running' || pipeline_task?.status === 'queued') {
		await runAgentArticleExtractTask({
			agent_id: args.agent_id,
			article_id: current_article.id
		})

		return
	}

	const article_id = await saveArticle({
		article_id: current_article.id,
		title: current_article.title,
		content: current_article.content,
		for: current_article.for,
		scope_type: 'agent',
		scope_id: args.agent_id,
		source: current_article.source ?? 'agent',
		metadata: current_article.metadata,
		exec_pipeline: true,
		await_graph_sync: true
	})

	await runAgentArticleExtractTask({
		agent_id: args.agent_id,
		article_id
	})
}

const runAgentPrivateArticlePipelineBatch = (agent_id: string) => {
	const running_task = agent_article_pipeline_batch_tasks.get(agent_id)

	if (running_task) {
		return running_task
	}

	const task = (async () => {
		const skipped_article_ids = new Set<string>()

		try {
			while (agent_article_pipeline_batch_running_agents.has(agent_id)) {
				await assertAgentWritableForKnowledge(agent_id)

				const next_article = await getNextPendingAgentPrivateArticle({
					agent_id,
					exclude_article_ids: Array.from(skipped_article_ids)
				})

				if (!next_article) {
					if (skipped_article_ids.size > 0) {
						skipped_article_ids.clear()

						continue
					}

					break
				}

				try {
					await extractAgentPrivateArticle({
						agent_id,
						article_id: next_article.id
					})

					skipped_article_ids.delete(next_article.id)
				} catch (error) {
					if (isPipelineWaitTimeoutError(error) || isTripleExtractionTimeoutError(error)) {
						await sleep(AGENT_ARTICLE_PIPELINE_POLL_MS)

						continue
					}

					skipped_article_ids.add(next_article.id)

					log('SAVE', 'agentPrivateArticleBatchItemError', () => ({
						agent_id,
						article_id: next_article.id,
						error: error instanceof Error ? error.message : String(error)
					}))
				}
			}
		} finally {
			agent_article_pipeline_batch_running_agents.delete(agent_id)
			agent_article_pipeline_batch_tasks.delete(agent_id)
			emitPipelineRefresh()
		}
	})()

	agent_article_pipeline_batch_tasks.set(agent_id, task)

	void task.catch((error: unknown) => {
		log('SAVE', 'agentPrivateArticlePipelineBatchError', () => ({
			agent_id,
			error: error instanceof Error ? error.message : String(error)
		}))
	})

	return task
}

export const getAgentPrivateArticlePipelineBatchState = async (agent_id: string) => {
	await ensureAgentExists(agent_id)

	return {
		running: agent_article_pipeline_batch_running_agents.has(agent_id),
		pending_count: await getPendingAgentPrivateArticleCount(agent_id)
	}
}

export const setAgentPrivateArticlePipelineBatchState = async (args: { agent_id: string; running: boolean }) => {
	await ensureAgentExists(args.agent_id)

	if (!args.running) {
		agent_article_pipeline_batch_running_agents.delete(args.agent_id)
		emitPipelineRefresh()

		return getAgentPrivateArticlePipelineBatchState(args.agent_id)
	}

	await assertAgentWritableForKnowledge(args.agent_id)
	const next_article = await getNextPendingAgentPrivateArticle({
		agent_id: args.agent_id
	})

	if (!next_article) {
		agent_article_pipeline_batch_running_agents.delete(args.agent_id)
		emitPipelineRefresh()

		return getAgentPrivateArticlePipelineBatchState(args.agent_id)
	}

	agent_article_pipeline_batch_running_agents.add(args.agent_id)
	emitPipelineRefresh()
	runAgentPrivateArticlePipelineBatch(args.agent_id)

	return getAgentPrivateArticlePipelineBatchState(args.agent_id)
}

export const savePrivateAgentArticle = async (args: {
	agent_id: string
	for_type: 'linkcase' | 'wiki' | 'memory' | 'user'
	title?: string | null
	content: string
	article_id?: string
}) => {
	await ensureAgentExists(args.agent_id)
	await assertAgentWritableForKnowledge(args.agent_id)

	if (args.article_id) {
		const current_article = await getArticle(eq(article.id, args.article_id))

		if (
			!current_article ||
			current_article.scope_type !== 'agent' ||
			current_article.scope_id !== args.agent_id
		) {
			throw new Error(`Agent private article not found: ${args.article_id}`)
		}
	}

	const article_id = await saveArticle({
		article_id: args.article_id,
		title: args.title,
		content: args.content,
		for: args.for_type,
		scope_type: 'agent',
		scope_id: args.agent_id,
		exec_pipeline: true,
		await_graph_sync: true
	})

	runAgentArticleExtractTask({
		agent_id: args.agent_id,
		article_id
	})

	const saved_article = await getArticle(eq(article.id, article_id))

	if (!saved_article) {
		throw new Error(`Agent private article not found after save: ${article_id}`)
	}

	return saved_article
}

export const triggerPrivateAgentArticleExtract = async (args: {
	agent_id: string
	article_id: string
	force?: boolean
}) => {
	await ensureAgentExists(args.agent_id)
	await assertAgentWritableForKnowledge(args.agent_id)

	const current_article = await getArticle(eq(article.id, args.article_id))

	if (!current_article || current_article.scope_type !== 'agent' || current_article.scope_id !== args.agent_id) {
		throw new Error(`Agent private article not found: ${args.article_id}`)
	}

	if (agent_article_extract_tasks.has(current_article.id)) {
		return {
			queued: true
		}
	}

	const pipeline_task = (await readPipelineStore())[current_article.id]

	if (pipeline_task?.status === 'running' || pipeline_task?.status === 'queued') {
		return {
			queued: true
		}
	}

	const article_id = await saveArticle({
		article_id: current_article.id,
		title: current_article.title,
		content: current_article.content,
		for: current_article.for,
		scope_type: 'agent',
		scope_id: args.agent_id,
		source: current_article.source ?? 'agent',
		metadata: current_article.metadata,
		exec_pipeline: true,
		await_graph_sync: true
	})

	runAgentArticleExtractTask({
		agent_id: args.agent_id,
		article_id
	})

	return {
		queued: true
	}
}

export const cleanupPrivateAgentArticle = async (args: { agent_id: string; article_id: string }) => {
	await clearAgentArticleGraph(args.agent_id, args.article_id)
}

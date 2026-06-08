import {
	deleteEdgeVector,
	deleteNodeVector,
	getEdgeRowid,
	getNodeRowid,
	insertEdgeVector,
	insertNodeVector
} from '@core/db/prepare'
import { agent, article, chunk, edge, edge_article, node, node_chunk } from '@core/db/schema'
import {
	addEdge,
	addNode,
	assertAgentWritableForKnowledge,
	getAgent,
	getArticle,
	getChunks,
	getEdge,
	getNode
} from '@core/db/services'
import { addEdgeArticle, addNodeChunk } from '@core/db/services/externals'
import { env } from '@core/env'
import { saveArticle } from '@core/io'
import { readPipelineStore } from '@core/io/save/pipelineStore'
import { getEmbedding, getTriples } from '@core/pipeline'
import { emitPipelineRefresh } from '@core/rpc/pipeline/emitter'
import { log } from '@core/utils'
import { and, asc, eq, inArray, not, sql } from 'drizzle-orm'

const AGENT_ARTICLE_PIPELINE_WAIT_MS = 90_000
const AGENT_ARTICLE_PIPELINE_POLL_MS = 250
const agent_article_extract_tasks = new Map<string, Promise<void>>()
const agent_article_pipeline_batch_running_agents = new Set<string>()
const agent_article_pipeline_batch_tasks = new Map<string, Promise<void>>()

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const normalizeTripleText = (value: string) => value.replace(/\s+/g, ' ').trim()

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

		if (current_article?.is_pipelined) {
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
	const embedding = await getEmbedding(normalized_name)
	const row = getNodeRowid().get(inserted.id) as { rowid: number } | undefined

	if (row) {
		deleteNodeVector().run(BigInt(row.rowid))
		insertNodeVector().run(BigInt(row.rowid), Buffer.from(new Float32Array(embedding).buffer))
	}

	return inserted
}

const ensureAgentEdge = async (agent_id: string, source_id: string, target_id: string, relation: string) => {
	const normalized_relation = normalizeTripleText(relation)

	if (!normalized_relation) {
		return null
	}

	const existing = await getEdge(
		and(
			eq(edge.agent_id, agent_id),
			eq(edge.source_id, source_id),
			eq(edge.target_id, target_id),
			eq(edge.relation, normalized_relation)
		)
	)

	if (existing) {
		return existing
	}

	return addEdge({
		agent_id,
		source_id,
		target_id,
		relation: normalized_relation
	})
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
			deleteEdgeVector().run(BigInt(row.rowid))
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
			deleteNodeVector().run(BigInt(row.rowid))
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

const getPendingAgentPrivateArticleWhere = (agent_id: string) =>
	and(eq(article.scope_type, 'agent'), eq(article.scope_id, agent_id), eq(article.is_pipelined, false))

const getNextPendingAgentPrivateArticle = async (args: { agent_id: string; exclude_article_ids?: Array<string> }) => {
	const { agent_id, exclude_article_ids = [] } = args
	const pending_where = getPendingAgentPrivateArticleWhere(agent_id)
	const pipeline_store = await readPipelineStore()
	const errored_article_ids = Object.entries(pipeline_store)
		.filter(([, task]) => task.status === 'error')
		.map(([article_id]) => article_id)
	const filtered_error_ids = errored_article_ids.filter(article_id => !exclude_article_ids.includes(article_id))
	const filtered_exclude_ids = exclude_article_ids.filter(Boolean)

	if (filtered_error_ids.length > 0) {
		const errored_article = await env.db
			.select()
			.from(article)
			.where(and(pending_where, inArray(article.id, filtered_error_ids)))
			.orderBy(asc(article.created_at), asc(article.id))
			.limit(1)
			.then(rows => rows[0] ?? null)

		if (errored_article) {
			return errored_article
		}
	}

	return env.db
		.select()
		.from(article)
		.where(
			filtered_exclude_ids.length > 0
				? and(pending_where, not(inArray(article.id, filtered_exclude_ids)))
				: pending_where
		)
		.orderBy(asc(article.created_at), asc(article.id))
		.limit(1)
		.then(rows => rows[0] ?? null)
}

const getPendingAgentPrivateArticleCount = async (agent_id: string) => {
	const row = await env.db
		.select({ count: sql<number>`count(*)` })
		.from(article)
		.where(getPendingAgentPrivateArticleWhere(agent_id))
		.then(rows => rows[0] ?? null)

	return Number(row?.count ?? 0)
}

const runAgentArticleExtractTask = (args: { agent_id: string; article_id: string }) => {
	const previous_task = agent_article_extract_tasks.get(args.article_id) || Promise.resolve()

	const task = previous_task
		.catch(() => null)
		.then(async () => {
			const content_chunks = await waitForArticlePipeline(args.article_id)
			const current_article = await getArticle(eq(article.id, args.article_id))
			const content = current_article?.content?.trim() ?? ''

			if (!content) {
				await clearAgentArticleGraph(args.agent_id, args.article_id)
				return
			}

			const triples = await getTriples(content)
			await clearAgentArticleGraph(args.agent_id, args.article_id)

			for (const triple of triples) {
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

				const edge_item = await ensureAgentEdge(args.agent_id, head_node.id, tail_node.id, relation)

				if (edge_item) {
					const edge_row = getEdgeRowid().get(edge_item.id) as { rowid: number } | undefined

					if (edge_row) {
						const edge_embedding = await getEmbedding(`${head_name} ${relation} ${tail_name}`)

						deleteEdgeVector().run(BigInt(edge_row.rowid))
						insertEdgeVector().run(
							BigInt(edge_row.rowid),
							Buffer.from(new Float32Array(edge_embedding).buffer)
						)
					}

					await addEdgeArticle(edge_item.id, args.article_id)
				}

				await linkNodesToChunks([head_node.id, tail_node.id], content_chunks, [head_name, tail_name])
			}
		})

	agent_article_extract_tasks.set(args.article_id, task)

	void task
		.catch((error: unknown) => {
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

	if (current_article.is_pipelined) {
		return
	}

	const running_extract_task = agent_article_extract_tasks.get(current_article.id)

	if (running_extract_task) {
		await running_extract_task

		return
	}

	const pipeline_task = (await readPipelineStore())[current_article.id]

	if (pipeline_task?.status === 'running') {
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
		exec_pipeline: true
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
		exec_pipeline: true
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

export const cleanupPrivateAgentArticle = async (args: { agent_id: string; article_id: string }) => {
	await clearAgentArticleGraph(args.agent_id, args.article_id)
}

import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import to from 'await-to-js'
import { container, singleton } from 'tsyringe'

import Activation from './Activation'
import Article from './Article'
import Brain from './Brain'
import Console from './Console'
import {
	DEFAULT_DATA_DIR,
	DEFAULT_EDGE_WEIGHT,
	DEFAULT_NODE_THRESHOLD,
	DEFAULT_RECALL_DEPTH,
	DEFAULT_RERANK_LIMIT,
	DEFAULT_SEARCH_LIMIT,
	DEFAULT_SIMILARITY_THRESHOLD,
	INPUT_DECAY_THRESHOLD,
	MEMORY_RECALL_INTENSITY,
	SNAPSHOT_NODES_LIMIT,
	SNAPSHOT_WEIGHT_THRESHOLD
} from './consts'
import Cortex from './Cortex'
import { catchError, catchFinally } from './decorators'
import Log from './Log'
import Pipeline from './Pipeline'
import Process from './Process'
import {
	sql_add_node,
	sql_connect,
	sql_create_extension_vector,
	sql_create_index_active_edges,
	sql_create_index_article_content_gin,
	sql_create_index_article_embeddings_hnsw,
	sql_create_index_core_truth,
	sql_create_index_edge_src,
	sql_create_index_edge_tgt,
	sql_create_index_edges_idol,
	sql_create_index_edges_roots,
	sql_create_index_nodes_idol,
	sql_create_index_nodes_roots,
	sql_create_schema_brain,
	sql_create_schema_memory,
	sql_create_table_article_embeddings,
	sql_create_table_articles,
	sql_create_table_edges,
	sql_create_table_node_sources,
	sql_create_table_nodes,
	sql_decay,
	sql_delete_article,
	sql_forget_decay_edges,
	sql_forget_decay_nodes,
	sql_get_all_nodes,
	sql_get_article_embedding,
	sql_get_edges_by_idol,
	sql_get_edges_by_root,
	sql_get_input_count,
	sql_get_nodes_by_idol,
	sql_get_nodes_by_root,
	sql_get_snapshot_edges,
	sql_get_snapshot_nodes,
	sql_increment_input_count,
	sql_inject_edges_begin,
	sql_inject_edges_commit,
	sql_inject_edges_insert_edge,
	sql_inject_edges_rollback,
	sql_inject_edges_update_edge,
	sql_insert_article_embedding,
	sql_memory_reorganization,
	sql_node_sources,
	sql_process_article,
	sql_propagate,
	sql_reset_input_count,
	sql_run_shadow_tick,
	sql_sleep_tick_begin,
	sql_sleep_tick_clean_noise,
	sql_sleep_tick_commit,
	sql_sleep_tick_decay,
	sql_sleep_tick_replay,
	sql_sleep_tick_reset_nodes,
	sql_stimulate,
	sql_update_article_embedding,
	sql_upsert_node
} from './sql'
import { sql_create_schema_meta, sql_create_table_schema_version, sql_get_current_version } from './sql/meta'
import {
	aggregateResults,
	CURRENT_SCHEMA_VERSION,
	extractKeywords,
	generateId,
	getEdgesBetweenNodes,
	getNodeContexts,
	migrate,
	recallNodesByKeywords,
	recallRelatedNodes,
	rerankMemory,
	validateMigrations
} from './utils'

import type {
	AddNodeArgs,
	ConnectArgs,
	Edge,
	FiltersArgs,
	FinalQueryResult,
	ForgetArticleArgs,
	Node,
	PolywiseArgs,
	ProcessArticleArgs,
	QueryArgs,
	RecallArgs,
	RecallNodesByKeywordsArgs,
	SingleSearchArgs,
	StrengthenRelatedEdgesArgs,
	UpdateArticleArgs
} from './types'

@singleton()
export default class Polywise {
	pipeline = container.resolve(Pipeline)
	article = container.resolve(Article)
	brain = container.resolve(Brain)
	cortex = container.resolve(Cortex)
	log = container.resolve(Log)
	activation = container.resolve(Activation)

	db!: PGlite
	idol_id: string | null = null
	root_ids: Array<string> | null = null
	metrics_ids: Array<string> | null = null

	onTick?: () => void

	private is_closed = false

	async init(args: PolywiseArgs = {}) {
		const {
			data_dir,
			cache_dir,
			embedding_config,
			reranker_config,
			keyword_config,
			log,
			idol_id,
			root_ids,
			metrics_ids,
			onTick
		} = args

		this.idol_id = idol_id ?? null
		this.root_ids = root_ids ?? null
		this.metrics_ids = metrics_ids ?? null

		this.onTick = onTick

		this.db = new PGlite(data_dir || DEFAULT_DATA_DIR, {
			relaxedDurability: true,
			extensions: { vector }
		})

		await this.initDatabase()

		await this.pipeline.init({
			cache_dir,
			embedding_config,
			reranker_config,
			keyword_config
		})

		this.article.init(this)
		this.brain.init(this)
		this.cortex.init(this)
		this.activation.init(this)

		if (log) {
			this.log.init(typeof log === 'boolean' ? {} : log)
		}
	}

	@catchError()
	@catchFinally(function (this: Polywise) {
		this.brain.setBusy(false)
	})
	async query(args: QueryArgs): Promise<FinalQueryResult> {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		const result = await this.cortex.process({
			...args,
			idol_id: args.idol_id ?? this.idol_id ?? undefined,
			root_ids: args.root_ids ?? this.root_ids ?? undefined,
			metrics_ids: args.metrics_ids ?? this.metrics_ids ?? undefined,
			process: args.process
		})

		args.process?.emit('final_result', result)

		this.log.write(args, result)

		return result
	}

	@catchError()
	@catchFinally(function (this: Polywise) {
		this.brain.setBusy(false)
	})
	async save(args: ProcessArticleArgs): Promise<string> {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		const {
			content,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			metrics_ids = this.metrics_ids,
			metadata
		} = args

		Console.log('SYSTEM', 'save start', { content_len: content.length, metadata })

		const article_id = generateId()

		const res = (await this.queryRaw(sql_process_article, [
			article_id,
			content,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])) as Array<{ id: string }>

		const aid = res[0].id

		const query_embedding = ((await this.pipeline.embed(content)) as Array<number>) || []

		if (query_embedding && query_embedding.length > 0) {
			const embedding_id = generateId()
			await this.queryRaw(sql_insert_article_embedding, [
				embedding_id,
				aid,
				`[${query_embedding.join(',')}]`
			])
		}

		const keywords = await this.pipeline.generateKeywords(content)

		if (keywords.length > 0) {
			Console.log('SYSTEM', 'keywords injected', { count: keywords.length })
			const node_ids = await this.injectKeywords({
				keywords,
				article_id: aid,
				idol_id,
				root_ids,
				metrics_ids
			})

			await this.activation.stimulate(node_ids, 1.0)
			await this.activation.spread()
		}

		this.log.write({ ...args, idol_id, root_ids, metrics_ids }, { memory_id: aid })

		Console.log('SYSTEM', 'save complete', { memory_id: aid })

		return aid
	}

	@catchError()
	@catchFinally(function (this: Polywise) {
		this.brain.setBusy(false)
	})
	async update(args: UpdateArticleArgs): Promise<string> {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		const {
			memory_id,
			content,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			metrics_ids = this.metrics_ids,
			metadata
		} = args

		Console.log('SYSTEM', 'save start', { content_len: content.length, metadata })

		await this.queryRaw(sql_forget_decay_nodes, [memory_id])
		await this.queryRaw(sql_forget_decay_edges, [memory_id])

		await this.article.update(memory_id, {
			content,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			metrics_ids: metrics_ids ?? undefined,
			metadata
		})

		const query_embedding = ((await this.pipeline.embed(content)) as Array<number>) || []

		if (query_embedding && query_embedding.length > 0) {
			await this.queryRaw(sql_update_article_embedding, [`[${query_embedding.join(',')}]`, memory_id])
		}

		const keywords = await this.pipeline.generateKeywords(content)

		if (keywords.length > 0) {
			const node_ids = await this.injectKeywords({
				keywords,
				article_id: memory_id,
				idol_id,
				root_ids,
				metrics_ids
			})

			await this.activation.stimulate(node_ids, 1.0)
			await this.activation.spread()
		}

		this.log.write({ ...args, idol_id, root_ids, metrics_ids }, { memory_id })

		Console.log('SYSTEM', 'save complete', { memory_id })

		return memory_id
	}

	@catchError()
	@catchFinally(function (this: Polywise) {
		this.brain.setBusy(false)
	})
	async forget(args: ForgetArticleArgs): Promise<void> {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		const { memory_id, query, idol_id, root_ids, metrics_ids } = args

		if (!memory_id && !query) return

		const memory_ids_to_delete: Set<string> = new Set()

		if (memory_id) {
			memory_ids_to_delete.add(memory_id)
		}

		if (query) {
			const result = await this.cortex.process({
				query,
				idol_id: idol_id ?? this.idol_id ?? undefined,
				root_ids: root_ids ?? this.root_ids ?? undefined,
				metrics_ids: metrics_ids ?? this.metrics_ids ?? undefined
			})

			for (const item of result.memory) {
				memory_ids_to_delete.add(item.memory_id)
			}
		}

		for (const id of memory_ids_to_delete) {
			await this.queryRaw(sql_forget_decay_nodes, [id])
			await this.queryRaw(sql_forget_decay_edges, [id])
			await this.queryRaw(sql_delete_article, [id, idol_id ?? null, root_ids ?? null, metrics_ids ?? null])
		}
	}

	setFilters(args: FiltersArgs) {
		const { idol_id, root_ids, metrics_ids } = args

		if (idol_id !== undefined) this.idol_id = idol_id
		if (root_ids !== undefined) this.root_ids = root_ids
		if (metrics_ids !== undefined) this.metrics_ids = metrics_ids
	}

	process(query: string) {
		const process = new Process(query)

		this.query({ query, process }).catch(err => {
			console.error('Process query error:', err)
			process.emit('error', err)
		})

		return process
	}

	async addNode(args: AddNodeArgs) {
		const {
			label,
			x,
			y,
			threshold,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			metrics_ids = this.metrics_ids,
			embedding,
			article_ids,
			lock
		} = args

		const node_id = generateId()

		const rows = (await this.queryRaw(sql_add_node, [
			node_id,
			label,
			x,
			y,
			threshold ?? DEFAULT_NODE_THRESHOLD,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			embedding ? `[${embedding.join(',')}]` : null,
			article_ids ?? null,
			lock ?? false
		])) as Array<{ id: string }>

		return rows[0].id
	}

	async connect(args: ConnectArgs) {
		const {
			source_id,
			target_id,
			weight,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			metrics_ids = this.metrics_ids,
			lock
		} = args

		const edge_id = generateId()

		await this.queryRaw(sql_connect, [
			edge_id,
			source_id,
			target_id,
			weight ?? DEFAULT_EDGE_WEIGHT,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			lock ?? false
		])
	}

	async injectKeywords(args: {
		keywords: Array<string>
		article_id: string
		idol_id?: string | null
		root_ids?: Array<string> | null
		metrics_ids?: Array<string> | null
	}) {
		const { keywords, article_id, idol_id, root_ids, metrics_ids } = args

		if (keywords.length < 2) {
			return []
		}

		await this.queryRaw(sql_inject_edges_begin)

		try {
			const node_ids: Array<string> = []
			for (const keyword of keywords) {
				const id = await this.upsertNode({
					label: keyword,
					idol_id,
					root_ids,
					metrics_ids,
					article_ids: [article_id]
				})
				node_ids.push(id)
				await this.queryRaw(sql_node_sources, [id, article_id])
			}

			for (let i = 0; i < node_ids.length - 1; i++) {
				const sub_id = node_ids[i]
				const obj_id = node_ids[i + 1]

				await this.queryRaw(
					sql_inject_edges_insert_edge(
						sub_id,
						obj_id,
						1.0,
						1.0,
						0.5,
						idol_id,
						root_ids,
						metrics_ids
					)
				)

				await this.queryRaw(
					sql_inject_edges_update_edge(
						sub_id,
						obj_id,
						1.0,
						1.0,
						0.1,
						idol_id,
						root_ids,
						metrics_ids
					)
				)
			}

			await this.queryRaw(sql_inject_edges_commit)

			return node_ids
		} catch (error) {
			await this.queryRaw(sql_inject_edges_rollback)

			throw error
		}
	}

	private async upsertNode(args: {
		label: string
		idol_id?: string | null
		root_ids?: Array<string> | null
		metrics_ids?: Array<string> | null
		article_ids?: Array<string> | null
		lock?: boolean
	}) {
		const { label, idol_id, root_ids, metrics_ids, article_ids, lock } = args
		const node_id = generateId()

		const rows = (await this.queryRaw(sql_upsert_node, [
			node_id,
			label,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			null,
			article_ids ?? null,
			lock ?? false
		])) as Array<{ id: string }>

		return rows[0].id
	}

	async stimulate(node_id: string, intensity = 1.0) {
		await this.queryRaw(sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = SNAPSHOT_WEIGHT_THRESHOLD, limit = SNAPSHOT_NODES_LIMIT) {
		const nodes = (await this.queryRaw(sql_get_snapshot_nodes(weight_threshold, limit))) as Array<Node>
		const edges = (await this.queryRaw(sql_get_snapshot_edges(weight_threshold))) as Array<Edge>

		const node_ids = new Set(nodes.map(n => n.id))
		const valid_edges = edges.filter(e => node_ids.has(e.source_id) && node_ids.has(e.target_id))

		return { nodes, edges: valid_edges }
	}

	async getAllNodes() {
		return (await this.queryRaw(sql_get_all_nodes)) as Array<Node>
	}

	async getNodesByIdol(idol_id: string) {
		return (await this.queryRaw(sql_get_nodes_by_idol, [idol_id])) as Array<Node>
	}

	async getNodesByRoot(root_id: string) {
		return (await this.queryRaw(sql_get_nodes_by_root, [root_id])) as Array<Node>
	}

	async getEdgesByIdol(idol_id: string) {
		return (await this.queryRaw(sql_get_edges_by_idol, [idol_id])) as Array<Edge>
	}

	async getEdgesByRoot(root_id: string) {
		return (await this.queryRaw(sql_get_edges_by_root, [root_id])) as Array<Edge>
	}

	async tick(threshold_override?: number) {
		const threshold = threshold_override ?? DEFAULT_NODE_THRESHOLD

		await this.exec(sql_propagate(threshold))

		await this.queryRaw(sql_increment_input_count)

		const count_res = (await this.queryRaw(sql_get_input_count)) as Array<{ value: number }>
		const count = count_res[0]?.value ?? 0

		if (count > INPUT_DECAY_THRESHOLD) {
			await this.exec(sql_decay)
			await this.exec(sql_reset_input_count)
		}
	}

	async runShadowTick() {
		await this.exec(sql_run_shadow_tick)

		await this.tick(0.8)
	}

	async triggerSleepTick() {
		await this.exec([
			sql_sleep_tick_begin,
			sql_sleep_tick_clean_noise,
			sql_sleep_tick_decay,
			sql_sleep_tick_replay,
			sql_sleep_tick_reset_nodes,
			sql_sleep_tick_commit
		])
	}

	async triggerMemoryReorganization() {
		await this.exec(sql_memory_reorganization)
	}

	async recallFromMemory(args: RecallArgs) {
		this.log.write({ query: args.query }, { event: 'recall_start' })

		const {
			query,
			max_depth = DEFAULT_RECALL_DEPTH,
			stimulate_intensity = MEMORY_RECALL_INTENSITY,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			metrics_ids = this.metrics_ids,
			limit = 20
		} = args

		const keywords = extractKeywords(query)

		const matched_nodes = await this.recallNodesByKeywords({
			keywords,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			metrics_ids: metrics_ids ?? undefined,
			limit
		})

		const related_nodes = await this.recallRelatedNodes(
			matched_nodes.map(n => n.id),
			max_depth,
			limit
		)

		const all_nodes = [...matched_nodes]
		const matched_ids = new Set(matched_nodes.map(n => n.id))

		for (const node of related_nodes) {
			if (!matched_ids.has(node.id)) {
				all_nodes.push(node)
				matched_ids.add(node.id)
			}
		}

		if (stimulate_intensity > 0) {
			const node_ids = all_nodes.map(n => n.id)

			await this.activation.stimulate(node_ids, stimulate_intensity)
			await this.activation.strengthen({ matched_nodes, related_nodes })
			await this.activation.spread(3)
		}

		const contexts = await this.getNodeContexts(all_nodes.map(n => n.id))

		const edges = await this.getEdgesBetweenNodes(all_nodes.map(n => n.id))

		return {
			nodes: all_nodes,
			edges,
			stimulated_nodes: all_nodes.map(n => n.id),
			related_contexts: contexts
		}
	}

	async executeSingleSearch(args: SingleSearchArgs) {
		const {
			query,
			recall_depth = DEFAULT_RECALL_DEPTH,
			search_limit = DEFAULT_SEARCH_LIMIT,
			rerank_limit = DEFAULT_RERANK_LIMIT,
			stimulate_on_recall = false,
			idol_id,
			root_ids,
			metrics_ids,
			process,
			threshold = DEFAULT_SIMILARITY_THRESHOLD
		} = args

		Console.log('SEARCH', 'executeSingleSearch start', { query })

		const query_embedding = (await this.pipeline.embed(query)) as Array<number>

		Console.log('SEARCH', 'recallFromMemory start')
		const recall_result = await this.recallFromMemory({
			query,
			max_depth: recall_depth,
			stimulate_intensity: stimulate_on_recall ? MEMORY_RECALL_INTENSITY : 0,
			query_embedding: query_embedding ?? undefined,
			idol_id,
			root_ids,
			metrics_ids
		})

		Console.log('SEARCH', 'article.searchByVector start')
		const vectorResults = await this.article.searchByVector({
			query,
			limit: search_limit,
			idol_id,
			root_ids,
			metrics_ids,
			threshold
		})
		process?.emit('vector_search_results', vectorResults)

		Console.log('SEARCH', 'article.searchByText start')
		const fulltextResults = await this.article.searchByText({
			query,
			limit: search_limit,
			idol_id,
			root_ids,
			metrics_ids
		})
		process?.emit('fulltext_search_results', fulltextResults)

		// --- NEW: Recall missing articles from memory ---
		const recalled_article_ids = new Set<string>()

		for (const context of recall_result.related_contexts) {
			for (const id of context.article_ids) {
				recalled_article_ids.add(id)
			}
		}

		const found_ids = new Set([...vectorResults.map(r => r.id), ...fulltextResults.map(r => r.id)])
		const missing_ids = Array.from(recalled_article_ids).filter(id => !found_ids.has(id))

		if (missing_ids.length > 0) {
			Console.log('SEARCH', 'fetching missing memory articles', { count: missing_ids.length })
			const missing_articles = await this.article.getMany(missing_ids)

			const missing_results = missing_articles.map(a => ({
				id: a.id,
				content: a.content,
				similarity: 0.5, // Give a reasonable base similarity for memory items
				metadata: a.metadata,
				created_at: a.created_at,
				updated_at: a.updated_at
			}))

			vectorResults.push(...missing_results)
		}
		// ------------------------------------------------

		Console.log('SEARCH', 'pipeline.search start')
		const search_results = await this.pipeline.search({
			query,
			rerank_limit: search_limit,
			vectorSearch: () => Promise.resolve(vectorResults),
			fulltextSearch: () => Promise.resolve(fulltextResults)
		})

		Console.log('SEARCH', 'aggregateResults start')
		const { memory } = await aggregateResults({
			recall_result,
			search_results
		})
		process?.emit('aggregated_results', { memory })

		Console.log('SEARCH', 'rerankMemory start')
		const reranked_memory = await rerankMemory(
			query,
			memory,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this),
			threshold
		)
		process?.emit('reranked_memory', reranked_memory)

		return {
			memory: reranked_memory
		}
	}

	async queryRaw<T = any>(sql_str: string, params?: Array<any>): Promise<Array<T>> {
		if (!this.db) {
			throw new Error('DB not initialized or already closed')
		}

		Console.log('SQL', 'queryRaw', { sql: sql_str.trim(), params })

		const res = await this.db.query<T>(sql_str, params)

		return res.rows
	}

	private async initDatabase() {
		try {
			validateMigrations()

			await this.exec(sql_create_schema_meta)
			await this.exec(sql_create_table_schema_version)

			const version_result = (await this.queryRaw(sql_get_current_version)) as Array<{
				version: number
			}>

			const current_version = version_result[0]?.version ?? 0

			if (current_version < CURRENT_SCHEMA_VERSION) {
				await migrate(current_version, this.exec.bind(this), this.queryRaw.bind(this))
			}
		} catch (error) {
			console.error('Database initialization error:', error)
		}
	}

	private async recallNodesByKeywords(args: RecallNodesByKeywordsArgs) {
		return await recallNodesByKeywords(args, this.queryRaw.bind(this))
	}

	private async recallRelatedNodes(node_ids: Array<string>, max_depth: number, limit: number) {
		return await recallRelatedNodes(node_ids, max_depth, this.queryRaw.bind(this), limit)
	}

	private async getEdgesBetweenNodes(node_ids: Array<string>) {
		return await getEdgesBetweenNodes(node_ids, this.queryRaw.bind(this))
	}

	private async getNodeContexts(node_ids: Array<string>) {
		return await getNodeContexts(node_ids, this.queryRaw.bind(this))
	}

	private async exec(sql_input: string | Array<string>) {
		if (!this.db) {
			throw new Error('DB not initialized')
		}

		if (Array.isArray(sql_input)) {
			for (const sql_str of sql_input) {
				await this.db.exec(sql_str)
			}

			return
		}

		await this.db.exec(sql_input)
	}

	async off() {
		if (this.is_closed) return

		this.is_closed = true
		this.brain.off()
		this.pipeline.off()

		await this.db.close()
	}
}

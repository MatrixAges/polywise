import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import to from 'await-to-js'
import { container, singleton } from 'tsyringe'

import Article from './Article'
import Brain from './Brain'
import {
	DEFAULT_DATA_DIR,
	DEFAULT_EDGE_WEIGHT,
	DEFAULT_NODE_THRESHOLD,
	DEFAULT_RECALL_DEPTH,
	DEFAULT_SIMILARITY_THRESHOLD,
	MEMORY_RECALL_INTENSITY,
	SNAPSHOT_WEIGHT_THRESHOLD
} from './consts'
import Cortex from './Cortex'
import { catchError, catchFinally } from './decorators'
import Log from './Log'
import Pipeline from './Pipeline'
import Process from './Process'
import * as sql from './sql'
import * as sql_meta from './sql/meta'
import {
	aggregateResults,
	CURRENT_SCHEMA_VERSION,
	extractKeywords,
	getNodeContexts,
	migrate,
	recallNodesByKeywords,
	recallRelatedNodes,
	rerankKnowledges,
	stimulateNodes,
	strengthenRelatedEdges,
	validateMigrations
} from './utils'

import type {
	AddNodeArgs,
	ConnectArgs,
	Edge,
	FiltersArgs,
	FinalQueryResult,
	Node,
	PolywiseArgs,
	ProcessArticleArgs,
	QueryArgs,
	RecallArgs,
	RecallNodesByKeywordsArgs,
	SingleSearchArgs,
	StrengthenRelatedEdgesArgs
} from './types'

@singleton()
export default class Polywise {
	pipeline = container.resolve(Pipeline)
	article = container.resolve(Article)
	brain = container.resolve(Brain)
	cortex = container.resolve(Cortex)
	log = container.resolve(Log)

	db: PGlite
	idol_id: string | null = null
	root_ids: Array<string> | null = null
	metrics_ids: Array<string> | null = null

	onTick?: () => void

	async init(args: PolywiseArgs = {}) {
		const {
			data_dir,
			cache_dir,
			embedding_config,
			reranker_config,
			embedding_concurrency,
			reranker_concurrency,
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
			embedding_concurrency,
			reranker_concurrency
		})

		this.article.init(this)
		this.brain.init(this)
		this.cortex.init(this)

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
	async save(args: ProcessArticleArgs) {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		const {
			content,
			article_id,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			metrics_ids = this.metrics_ids,
			metadata
		} = args

		let aid = article_id

		if (!aid) {
			const res = (await this.queryRaw(sql.sql_process_article, [
				content,
				idol_id ?? null,
				root_ids ?? null,
				metrics_ids ?? null,
				JSON.stringify(metadata ?? {})
			])) as Array<{ id: number }>

			aid = res[0].id
		}

		const query_embedding = ((await this.pipeline.embed(content)) as Array<number>) || []

		if (query_embedding && query_embedding.length > 0) {
			const existing_embedding = await this.queryRaw(sql.sql_get_article_embedding, [aid])

			if (existing_embedding.length > 0) {
				await this.queryRaw(sql.sql_update_article_embedding, [`[${query_embedding.join(',')}]`, aid])
			} else {
				await this.queryRaw(sql.sql_insert_article_embedding, [aid, `[${query_embedding.join(',')}]`])
			}
		}

		this.log.write({ ...args, idol_id, root_ids, metrics_ids }, { article_id: aid })
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
			metadata,
			embedding
		} = args

		const rows = (await this.queryRaw(sql.sql_add_node, [
			label,
			x,
			y,
			threshold ?? DEFAULT_NODE_THRESHOLD,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {}),
			embedding ? `[${embedding.join(',')}]` : null
		])) as Array<{ id: number }>

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
			metadata
		} = args

		await this.queryRaw(sql.sql_connect, [
			source_id,
			target_id,
			weight ?? DEFAULT_EDGE_WEIGHT,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])
	}

	async stimulate(node_id: number, intensity = 1.0) {
		await this.queryRaw(sql.sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = SNAPSHOT_WEIGHT_THRESHOLD) {
		const nodes = (await this.queryRaw(sql.sql_get_snapshot_nodes(weight_threshold))) as Array<Node>
		const edges = (await this.queryRaw(sql.sql_get_snapshot_edges(weight_threshold))) as Array<Edge>

		return { nodes, edges }
	}

	async getAllNodes() {
		return (await this.queryRaw(sql.sql_get_all_nodes)) as Array<Node>
	}

	async getNodesByIdol(idol_id: string) {
		return (await this.queryRaw(sql.sql_get_nodes_by_idol, [idol_id])) as Array<Node>
	}

	async getNodesByRoot(root_id: string) {
		return (await this.queryRaw(sql.sql_get_nodes_by_root, [root_id])) as Array<Node>
	}

	async getEdgesByIdol(idol_id: string) {
		return (await this.queryRaw(sql.sql_get_edges_by_idol, [idol_id])) as Array<Edge>
	}

	async getEdgesByRoot(root_id: string) {
		return (await this.queryRaw(sql.sql_get_edges_by_root, [root_id])) as Array<Edge>
	}

	async tick(threshold_override?: number) {
		const threshold = threshold_override ?? DEFAULT_NODE_THRESHOLD

		await this.exec(sql.sql_tick(threshold))
	}

	async runShadowTick() {
		await this.exec(sql.sql_run_shadow_tick)

		await this.tick(0.8)
	}

	async triggerSleepTick() {
		await this.exec([
			sql.sql_sleep_tick_begin,
			sql.sql_sleep_tick_clean_noise,
			sql.sql_sleep_tick_decay,
			sql.sql_sleep_tick_replay,
			sql.sql_sleep_tick_reset_nodes,
			sql.sql_sleep_tick_commit
		])
	}

	async recallFromMemory(args: RecallArgs) {
		const {
			query,
			max_depth = DEFAULT_RECALL_DEPTH,
			stimulate_intensity = MEMORY_RECALL_INTENSITY,
			idol_id = this.idol_id,
			root_ids = this.root_ids
		} = args

		const keywords = extractKeywords(query)

		const matched_nodes = await this.recallNodesByKeywords({
			keywords,
			idol_id,
			root_ids
		})

		const related_nodes = await this.recallRelatedNodes(
			matched_nodes.map(n => n.id),
			max_depth
		)

		if (stimulate_intensity > 0) {
			const all_nodes = [...matched_nodes, ...related_nodes]
			const node_ids = all_nodes.map(n => n.id)

			await this.stimulateNodes(node_ids, stimulate_intensity)
			await this.strengthenRelatedEdges({ matched_nodes, related_nodes })
		}

		const contexts = await this.getNodeContexts([...matched_nodes, ...related_nodes].map(n => n.id))

		return {
			nodes: [...matched_nodes, ...related_nodes],
			edges: [],
			stimulated_nodes: [...matched_nodes, ...related_nodes].map(n => n.id),
			related_contexts: contexts
		}
	}

	async executeSingleSearch(args: SingleSearchArgs) {
		const {
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			idol_id,
			root_ids,
			metrics_ids,
			process,
			threshold = DEFAULT_SIMILARITY_THRESHOLD
		} = args

		const query_embedding = (await this.pipeline.embed(query)) as Array<number>

		const recall_result = await this.recallFromMemory({
			query,
			max_depth: recall_depth,
			stimulate_intensity: stimulate_on_recall ? MEMORY_RECALL_INTENSITY : 0,
			query_embedding: query_embedding ?? undefined,
			idol_id,
			root_ids,
			metrics_ids
		})

		const vectorResults = await this.article.searchByVector({
			query,
			limit: search_limit,
			idol_id,
			root_ids,
			metrics_ids,
			threshold
		})
		process?.emit('vector_search_results', vectorResults)

		const fulltextResults = await this.article.searchByText({
			query,
			limit: search_limit,
			idol_id,
			root_ids,
			metrics_ids
		})
		process?.emit('fulltext_search_results', fulltextResults)

		const search_results = await this.pipeline.search({
			query,
			rerank_limit: search_limit,
			vectorSearch: () => Promise.resolve(vectorResults),
			fulltextSearch: () => Promise.resolve(fulltextResults)
		})

		const { knowledges } = await aggregateResults({
			recall_result,
			search_results
		})
		process?.emit('aggregated_results', { knowledges })

		const reranked_knowledges = await rerankKnowledges(
			query,
			knowledges,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this),
			threshold
		)
		process?.emit('reranked_knowledges', reranked_knowledges)

		return {
			knowledges: reranked_knowledges
		}
	}

	async queryRaw(sql_str: string, params?: Array<any>) {
		if (!this.db) {
			throw new Error('DB not initialized or already closed')
		}

		const res = await this.db.query(sql_str, params)

		return res.rows
	}

	private async initDatabase() {
		const [val_err] = await to(Promise.resolve(validateMigrations()))

		if (val_err) {
			console.error('Migration validation error:', val_err)
		}

		const [err] = await to(
			(async () => {
				await this.exec(sql_meta.sql_create_schema_meta)
				await this.exec(sql_meta.sql_create_table_schema_version)

				const version_result = (await this.queryRaw(sql_meta.sql_get_current_version)) as Array<{
					version: number
				}>

				const current_version = version_result[0]?.version ?? 0

				if (current_version < CURRENT_SCHEMA_VERSION) {
					await migrate(current_version, this.exec.bind(this), this.queryRaw.bind(this))
				}

				await this.initSchema()
			})()
		)

		if (err) {
			console.error('Migration error:', err)
		}
	}

	private async initSchema() {
		const check_result = (await this.queryRaw(sql.sql_check_articles_table_exists)) as Array<{ count: string }>

		if (parseInt(check_result[0]?.count || '0') === 0) {
			await this.exec([
				sql.sql_create_extension_vector,
				sql.sql_create_schema_knowledge,
				sql.sql_create_table_articles,
				sql.sql_create_table_article_embeddings,
				sql.sql_create_index_article_embeddings_hnsw,
				sql.sql_create_index_article_content_gin,
				sql.sql_create_schema_brain,
				sql.sql_create_table_nodes,
				sql.sql_create_table_edges,
				sql.sql_create_index_edge_src,
				sql.sql_create_index_edge_tgt,
				sql.sql_create_index_active_edges,
				sql.sql_create_index_core_truth,
				sql.sql_create_index_nodes_idol,
				sql.sql_create_index_edges_idol,
				sql.sql_create_index_nodes_roots,
				sql.sql_create_index_edges_roots,
				sql.sql_create_table_node_sources
			])
		}
	}

	private async recallNodesByKeywords(args: RecallNodesByKeywordsArgs) {
		return await recallNodesByKeywords(args, this.queryRaw.bind(this))
	}

	private async recallRelatedNodes(node_ids: Array<number>, max_depth: number) {
		return await recallRelatedNodes(node_ids, max_depth, this.queryRaw.bind(this))
	}

	private async getNodeContexts(node_ids: Array<number>) {
		return await getNodeContexts(node_ids, this.queryRaw.bind(this))
	}

	private async stimulateNodes(node_ids: Array<number>, intensity: number) {
		await stimulateNodes(node_ids, intensity, this.queryRaw.bind(this))
	}

	private async strengthenRelatedEdges(args: StrengthenRelatedEdgesArgs) {
		await strengthenRelatedEdges(args, this.queryRaw.bind(this))
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
		this.brain.off()
		this.pipeline.off()

		await this.db.close()

		this.db = null
	}
}

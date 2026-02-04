import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import { singleton } from 'tsyringe'
import to from 'await-to-js'

import Article from './Article'
import Brain from './Brain'
import Log from './Log'
import Pipeline from './Pipeline'
import * as sql from './sql'
import * as sql_meta from './sql/meta'
import { catchError, catchFinally } from './decorators'
import {
	ChainEmitter,
	CURRENT_SCHEMA_VERSION,
	migrate,
	validateMigrations,
	extractKeywords,
	processResults,
	aggregateResults,
	rerankKnowledges,
	rerankActions,
	recallNodesByKeywords,
	recallRelatedNodes,
	getNodeContexts,
	stimulateNodes,
	strengthenRelatedEdges,
	handleHabitReaction,
	getHabits,
	formEmergentQuery,
	performEmergentSearch,
	emitCotResult
} from './utils'

import {
	DEFAULT_RECALL_DEPTH,
	DEFAULT_SEARCH_LIMIT,
	DEFAULT_RERANK_LIMIT,
	DEFAULT_HABIT_THRESHOLD,
	DEFAULT_NODE_THRESHOLD,
	DEFAULT_EDGE_WEIGHT,
	SNAPSHOT_WEIGHT_THRESHOLD,
	MEMORY_RECALL_INTENSITY
} from './consts'

import type {
	AddNodeArgs,
	ConnectArgs,
	Edge,
	Node,
	PolywiseArgs,
	ProcessArticleArgs,
	QueryArgs,
	RecallArgs,
	SingleSearchArgs,
	ExecuteCotArgs,
	RecallNodesByKeywordsArgs,
	StrengthenRelatedEdgesArgs,
	Knowledge,
	Action,
	FiltersArgs,
	FinalQueryResult
} from './types'

@singleton()
export default class Polywise {
	private db: PGlite | null = null
	private idol_id: string | null = null
	private root_ids: string[] | null = null
	private metrics_ids: string[] | null = null

	public article: Article
	public brain: Brain
	public pipeline: Pipeline
	public log: Log

	constructor() {
		this.log = new Log()
		this.pipeline = new Pipeline()
		this.article = new Article(this.pipeline)
		this.brain = new Brain()
	}

	async init(args: PolywiseArgs = {}) {
		const {
			data_dir,
			cache_dir,
			embedding_config,
			reranker_config,
			embedding_concurrency,
			reranker_concurrency,
			onTick,
			log,
			idol_id,
			root_ids,
			metrics_ids
		} = args

		this.db = new PGlite(data_dir || ':polywise:', {
			relaxedDurability: true,
			extensions: { vector }
		})

		this.idol_id = idol_id ?? null
		this.root_ids = root_ids ?? null
		this.metrics_ids = metrics_ids ?? null

		if (log) {
			this.log.init(typeof log === 'boolean' ? {} : log)
		}

		await this.pipeline.init({
			cache_dir,
			embedding_config,
			reranker_config,
			embedding_concurrency,
			reranker_concurrency
		})

		this.article.init(this.db)

		this.brain.init({
			poly: this,
			onTick
		})

		await this.initDatabase()
	}

	setFilters(args: FiltersArgs) {
		const { idol_id, root_ids, metrics_ids } = args

		if (idol_id !== undefined) this.idol_id = idol_id
		if (root_ids !== undefined) this.root_ids = root_ids
		if (metrics_ids !== undefined) this.metrics_ids = metrics_ids
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

				const version_result = (await this.queryRaw(sql_meta.sql_get_current_version)) as {
					version: number
				}[]

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
		const check_result = (await this.queryRaw(sql.sql_check_articles_table_exists)) as { count: string }[]

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

	@catchError()
	@catchFinally(function (this: Polywise) {
		this.brain.setBusy(false)
	})
	async query(args: QueryArgs): Promise<FinalQueryResult> {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		const {
			query,
			recall_depth = DEFAULT_RECALL_DEPTH,
			search_limit = DEFAULT_SEARCH_LIMIT,
			rerank_limit = DEFAULT_RERANK_LIMIT,
			cot_depth = 0,
			stimulate_on_recall = true,
			habit_threshold = DEFAULT_HABIT_THRESHOLD,
			idol_id = this.idol_id,
			root_ids = this.root_ids
		} = args

		const emitter = new ChainEmitter()

		const query_embedding = ((await this.pipeline.embed(query)) as number[]) || []

		const { knowledges: initial_knowledges, actions: initial_actions } = await this.executeSingleSearch({
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined
		})

		await this.handleHabitReaction({
			query,
			query_embedding,
			initial_actions,
			habit_threshold
		})

		const {
			knowledges: k_strings,
			actions: a_strings,
			metadata
		} = await processResults(query, initial_knowledges, initial_actions, this.pipeline)

		if (cot_depth <= 0) {
			const result = {
				knowledges: k_strings,
				actions: a_strings,
				metadata,
				cot: (emitter.finish({ knowledges: k_strings, actions: a_strings, metadata }) as any) || emitter
			}

			this.log.write(args, result)

			return result
		}

		const history_ids = new Set([...initial_knowledges, ...initial_actions].map(r => r.id))

		this.executeCot({
			query,
			current_depth: 1,
			max_depth: cot_depth,
			base_recall_depth: recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			initial_knowledges,
			initial_actions,
			emitter,
			history_ids,
			idol_id,
			root_ids
		})

		const result = {
			knowledges: k_strings,
			actions: a_strings,
			metadata,
			cot: emitter
		}

		this.log.write(args, result)

		return result
	}

	private async handleHabitReaction(args: {
		query: string
		query_embedding: number[]
		initial_actions: Action[]
		habit_threshold: number
	}) {
		await handleHabitReaction(args, this.queryRaw.bind(this), (node_id, intensity) =>
			this.stimulate(node_id, intensity)
		)
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
			metrics_ids = this.metrics_ids
		} = args

		const res = (await this.queryRaw(sql.sql_process_article, [
			content,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])) as { id: number }[]

		const aid = article_id ?? res[0].id

		await this.article.addEmbedding(aid, content)

		const query_embedding = (await this.pipeline.embed(content)) as number[]

		if (query_embedding && query_embedding.length > 0) {
			await this.queryRaw(sql.sql_update_article_embedding, [`[${query_embedding.join(',')}]`, aid])
		}

		this.log.write({ ...args, idol_id, root_ids, metrics_ids }, { article_id: aid })
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
			embedding,
			is_action
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
			embedding ? `[${embedding.join(',')}]` : null,
			is_action ?? false
		])) as { id: number }[]

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
			metadata,
			is_habit
		} = args

		await this.queryRaw(sql.sql_connect, [
			source_id,
			target_id,
			weight ?? DEFAULT_EDGE_WEIGHT,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {}),
			is_habit ?? false
		])
	}

	async stimulate(node_id: number, intensity = 1.0) {
		await this.queryRaw(sql.sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = SNAPSHOT_WEIGHT_THRESHOLD) {
		const nodes = await this.queryRaw(sql.sql_get_snapshot_nodes(weight_threshold))
		const edges = await this.queryRaw(sql.sql_get_snapshot_edges(weight_threshold))

		return { nodes, edges }
	}

	async getAllNodes() {
		return (await this.queryRaw(sql.sql_get_all_nodes)) as Node[]
	}

	async getNodesByIdol(idol_id: string) {
		return (await this.queryRaw(sql.sql_get_nodes_by_idol, [idol_id])) as Node[]
	}

	async getNodesByRoot(root_id: string) {
		return (await this.queryRaw(sql.sql_get_nodes_by_root, [root_id])) as Node[]
	}

	async getEdgesByIdol(idol_id: string) {
		return (await this.queryRaw(sql.sql_get_edges_by_idol, [idol_id])) as Edge[]
	}

	async getEdgesByRoot(root_id: string) {
		return (await this.queryRaw(sql.sql_get_edges_by_root, [root_id])) as Edge[]
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

	private async recallFromMemory(args: RecallArgs) {
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

	private async executeSingleSearch(args: SingleSearchArgs) {
		const { query, recall_depth, search_limit, rerank_limit, stimulate_on_recall, idol_id, root_ids } = args

		const query_embedding = (await this.pipeline.embed(query)) as number[]

		const recall_result = await this.recallFromMemory({
			query,
			max_depth: recall_depth,
			stimulate_intensity: stimulate_on_recall ? MEMORY_RECALL_INTENSITY : 0,
			query_embedding: query_embedding ?? undefined,
			idol_id,
			root_ids
		})

		const search_results = await this.pipeline.search({
			query,
			rerank_limit: search_limit,
			vector_search: () => this.article.searchVector(query, search_limit),
			fulltext_search: () => this.article.searchFts(query, search_limit)
		})

		const habits = await this.getHabits(query_embedding)

		const { knowledges, actions } = await aggregateResults(
			{
				recall_result,
				search_results,
				habits
			},
			this.queryRaw.bind(this)
		)

		const reranked_knowledges = await rerankKnowledges(
			query,
			knowledges,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this)
		)

		const reranked_actions = await rerankActions(
			query,
			actions,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this)
		)

		return {
			knowledges: reranked_knowledges,
			actions: reranked_actions
		}
	}

	private async getHabits(query_embedding: number[]) {
		return await getHabits(query_embedding, this.queryRaw.bind(this))
	}

	@catchError(function (this: Polywise, error: any, args: ExecuteCotArgs) {
		const { query, emitter, initial_knowledges, initial_actions } = args

		if (this.isDbError(error)) {
			if (emitter.isActiveStatus()) {
				processResults(query, initial_knowledges, initial_actions, this.pipeline).then(data => {
					emitter.finish(data)
				})
			}

			return true
		}

		console.error('CoT Execution Error:', error)

		if (emitter.isActiveStatus()) {
			processResults(query, initial_knowledges, initial_actions, this.pipeline).then(data => {
				emitter.finish(data)
			})
		}
	})
	private async executeCot(args: ExecuteCotArgs) {
		const {
			query,
			current_depth,
			max_depth,
			base_recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			initial_knowledges,
			initial_actions,
			emitter,
			history_ids,
			idol_id,
			root_ids
		} = args

		if (!emitter.isActiveStatus() || current_depth > max_depth || !this.db) {
			emitter.finish(await processResults(query, initial_knowledges, initial_actions, this.pipeline))

			return
		}

		const emerged_query = await this.formEmergentQuery({
			query,
			current_depth,
			initial_knowledges,
			initial_actions
		})

		const { emerged_knowledges, emerged_actions, emerged_recall_result } = await this.performEmergentSearch({
			emerged_query,
			current_depth,
			base_recall_depth,
			search_limit,
			stimulate_on_recall,
			history_ids,
			idol_id,
			root_ids
		})

		const reranked_knowledges = await rerankKnowledges(
			emerged_query,
			emerged_knowledges,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this)
		)

		const reranked_actions = await rerankActions(
			emerged_query,
			emerged_actions,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this)
		)

		reranked_knowledges.forEach(r => history_ids.add(r.id))
		reranked_actions.forEach(r => history_ids.add(r.id))

		this.emitCotResult({
			emitter,
			current_depth,
			emerged_query,
			reranked_knowledges,
			reranked_actions,
			emerged_recall_result
		})

		this.scheduleNextCotStep({
			query: emerged_query,
			current_depth,
			max_depth,
			base_recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			initial_knowledges: reranked_knowledges,
			initial_actions: reranked_actions,
			emitter,
			history_ids,
			idol_id,
			root_ids
		})
	}

	private async performEmergentSearch(args: {
		emerged_query: string
		current_depth: number
		base_recall_depth: number
		search_limit: number
		stimulate_on_recall: boolean
		history_ids: Set<number>
		idol_id?: string
		root_ids?: string[]
	}) {
		return await performEmergentSearch(args, this)
	}

	private async emitCotResult(args: {
		emitter: ChainEmitter
		current_depth: number
		emerged_query: string
		reranked_knowledges: Knowledge[]
		reranked_actions: Action[]
		emerged_recall_result: any
	}) {
		await emitCotResult({ ...args, pipeline: this.pipeline })
	}

	private scheduleNextCotStep(args: ExecuteCotArgs) {
		const {
			query,
			current_depth,
			max_depth,
			base_recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			initial_knowledges,
			initial_actions,
			emitter,
			history_ids,
			idol_id,
			root_ids
		} = args

		if (current_depth < max_depth && (initial_knowledges.length > 0 || initial_actions.length > 0)) {
			setImmediate(async () => {
				if (!this.db) {
					emitter.finish(
						await processResults(query, initial_knowledges, initial_actions, this.pipeline)
					)

					return
				}

				this.executeCot({
					query,
					current_depth: current_depth + 1,
					max_depth,
					base_recall_depth,
					search_limit,
					rerank_limit,
					stimulate_on_recall,
					initial_knowledges,
					initial_actions,
					emitter,
					history_ids,
					idol_id,
					root_ids
				})
			})
		} else {
			processResults(query, initial_knowledges, initial_actions, this.pipeline).then(data => {
				emitter.finish(data)
			})
		}
	}

	private isDbError(e: any) {
		const msg = e.message || ''
		return (
			msg.includes('DB not initialized') ||
			msg.includes('closed') ||
			msg.includes('signature mismatch') ||
			msg.includes('null function') ||
			e?.name === 'RuntimeError'
		)
	}

	private async formEmergentQuery(args: {
		query: string
		current_depth: number
		initial_knowledges: Knowledge[]
		initial_actions: Action[]
	}) {
		return await formEmergentQuery(args, (node_ids, intensity) => this.stimulateNodes(node_ids, intensity))
	}

	private async recallNodesByKeywords(args: RecallNodesByKeywordsArgs) {
		return await recallNodesByKeywords(args, this.queryRaw.bind(this))
	}

	private async recallRelatedNodes(node_ids: number[], max_depth: number) {
		return await recallRelatedNodes(node_ids, max_depth, this.queryRaw.bind(this))
	}

	private async getNodeContexts(node_ids: number[]) {
		return await getNodeContexts(node_ids, this.queryRaw.bind(this))
	}

	private async stimulateNodes(node_ids: number[], intensity: number) {
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

	private async queryRaw(sql_str: string, params?: any[]) {
		if (!this.db) {
			throw new Error('DB not initialized')
		}

		const res = params ? await this.db.query(sql_str, params) : await this.db.query(sql_str)

		return JSON.parse(JSON.stringify(res.rows))
	}

	async off() {
		this.brain?.off()
		this.article?.off()
		this.pipeline?.off()

		if (this.db) {
			await this.db.close()

			this.db = null
		}
	}
}

import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import { singleton } from 'tsyringe'
import to from 'await-to-js'

import Article from './Article'
import Brain from './Brain'
import Log from './Log'
import Pipeline from './Pipeline'
import * as sql from './sql'
import * as sql_brain from './sql/Brain'
import * as sql_meta from './sql/meta'
import { catchError, catchFinally } from './decorators'
import {
	ChainEmitter,
	CURRENT_SCHEMA_VERSION,
	migrate,
	validateMigrations,
	extractKeywords,
	calculateMemoryStrength,
	processResults
} from './utils'

import {
	formatNodeContent,
	formatSourceInfo,
	formatPerceiveQuery,
	DEFAULT_RECALL_DEPTH,
	DEFAULT_SEARCH_LIMIT,
	DEFAULT_RERANK_LIMIT,
	DEFAULT_HABIT_THRESHOLD,
	DEFAULT_NODE_THRESHOLD,
	DEFAULT_EDGE_WEIGHT,
	SNAPSHOT_WEIGHT_THRESHOLD,
	HABIT_REACTION_THRESHOLD,
	MEMORY_RECALL_INTENSITY,
	COT_MAX_RESULTS,
	COT_STIMULATE_BASE,
	COT_STIMULATE_FACTOR,
	SEARCH_LIMIT_FACTOR,
	POTENTIAL_THRESHOLD,
	MAX_IMPLICIT_RESULTS,
	RELEVANCE_SCORE_FACTOR,
	RERANK_SCORE_WEIGHT,
	RELEVANCE_SCORE_WEIGHT,
	STIMULATION_MAX,
	STIMULATION_MIN,
	HABIT_LEARNING_WEIGHT,
	HABIT_THRESHOLD_LOW,
	STRENGTHEN_EDGE_WEIGHT
} from './consts'

import type {
	AddNodeArgs,
	ConnectArgs,
	COTDepthResult,
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
	AggregateResultsArgs,
	FiltersArgs,
	FinalQueryResult,
	Metadata
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
		const { query_embedding, initial_actions, habit_threshold } = args

		if (!query_embedding || !this.db) return

		const nearest_stimulus = await this.queryRaw(sql.sql_find_nearest_node, [`[${query_embedding.join(',')}]`])

		if (nearest_stimulus.length === 0) return

		const stimulus = nearest_stimulus[0]

		if (
			stimulus.similarity > HABIT_REACTION_THRESHOLD &&
			(stimulus.activation >= stimulus.threshold || stimulus.potential >= stimulus.threshold)
		) {
			const habits = await this.queryRaw(sql.sql_find_strongest_habit, [stimulus.id])

			if (habits.length > 0 && habits[0].weight >= habit_threshold) {
				const h = habits[0]

				const fast_action: Action = {
					id: h.target_id,
					content: h.action,
					source: 'memory',
					rerankScore: 1.0,
					relevanceScore: 1.0,
					combinedScore: 1.0,
					stimulated: true,
					memoryStrength: h.weight,
					metadata: h.action_metadata || {}
				}

				if (!initial_actions.find(a => a.id === fast_action.id)) {
					initial_actions.unshift(fast_action)
				}

				await this.queryRaw(sql.sql_increment_reaction_count, [stimulus.id, h.target_id])
			}
		}

		await this.stimulate(stimulus.id, STIMULATION_MAX)
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

		const { knowledges, actions } = await this.aggregateResults({
			recall_result,
			search_results,
			habits
		})

		const reranked_knowledges = await this.rerankKnowledges(query, knowledges, rerank_limit)

		const reranked_actions = await this.rerankActions(query, actions, rerank_limit)

		return {
			knowledges: reranked_knowledges,
			actions: reranked_actions
		}
	}

	private async getHabits(query_embedding: number[]) {
		if (!query_embedding) return []

		return (await this.queryRaw(sql.sql_find_nearest_node, [`[${query_embedding.join(',')}]`])) as any[]
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

		const reranked_knowledges = await this.rerankKnowledges(emerged_query, emerged_knowledges, rerank_limit)

		const reranked_actions = await this.rerankActions(emerged_query, emerged_actions, rerank_limit)

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
		const {
			emerged_query,
			current_depth,
			base_recall_depth,
			search_limit,
			stimulate_on_recall,
			history_ids,
			idol_id,
			root_ids
		} = args

		const depth_recall_depth = base_recall_depth + current_depth
		const query_embedding = (await this.pipeline.embed(emerged_query)) as number[]

		const emerged_recall_result = await this.recallFromMemory({
			query: emerged_query,
			max_depth: depth_recall_depth,
			stimulate_intensity: stimulate_on_recall ? MEMORY_RECALL_INTENSITY * (1 + current_depth) : 0,
			query_embedding: query_embedding ?? undefined,
			idol_id,
			root_ids
		})

		const emerged_search_results = await this.pipeline.search({
			query: emerged_query,
			rerank_limit: search_limit * SEARCH_LIMIT_FACTOR,
			vector_search: () => this.article.searchVector(emerged_query, search_limit * SEARCH_LIMIT_FACTOR),
			fulltext_search: () => this.article.searchFts(emerged_query, search_limit * SEARCH_LIMIT_FACTOR)
		})

		const habits = await this.getHabits(query_embedding)

		const { knowledges, actions } = await this.aggregateResults({
			recall_result: emerged_recall_result,
			search_results: emerged_search_results,
			habits
		})

		return {
			emerged_knowledges: knowledges.filter(k => !history_ids.has(k.id)),
			emerged_actions: actions.filter(a => !history_ids.has(a.id)),
			emerged_recall_result
		}
	}

	private async emitCotResult(args: {
		emitter: ChainEmitter
		current_depth: number
		emerged_query: string
		reranked_knowledges: Knowledge[]
		reranked_actions: Action[]
		emerged_recall_result: any
	}) {
		const { emitter, emerged_query, reranked_knowledges, reranked_actions } = args

		const { knowledges, actions, metadata } = await processResults(
			emerged_query,
			reranked_knowledges,
			reranked_actions,
			this.pipeline
		)

		const cot_result: COTDepthResult = {
			knowledges,
			actions,
			metadata
		}

		if (emitter.isActiveStatus()) {
			emitter.emit(cot_result)
		}
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
		const { query, current_depth, initial_knowledges, initial_actions } = args

		const top_results = [...initial_knowledges, ...initial_actions].slice(0, COT_MAX_RESULTS)
		const insights = top_results.map(r => r.content.slice(0, 50)).join(', ')
		const emerged_query = formatPerceiveQuery(query, insights)
		const emerged_node_ids = top_results.map(r => r.id)

		await this.stimulateNodes(emerged_node_ids, COT_STIMULATE_BASE * (1 + current_depth * COT_STIMULATE_FACTOR))

		return emerged_query
	}

	private async recallNodesByKeywords(args: RecallNodesByKeywordsArgs) {
		const { keywords, limit = 10, idol_id, root_ids } = args

		if (keywords.length === 0) {
			return []
		}

		const results: Node[] = []

		for (const keyword of keywords) {
			const nodes = (await this.queryRaw(sql_brain.sql_recall_nodes_by_label, [
				`%${keyword}%`,
				limit,
				idol_id,
				root_ids
			])) as Node[]

			results.push(...nodes)
		}

		return Array.from(new Map(results.map(n => [n.id, n])).values())
	}

	private async recallRelatedNodes(node_ids: number[], max_depth: number) {
		if (node_ids.length === 0 || max_depth <= 0) {
			return []
		}

		return (await this.queryRaw(sql_brain.sql_recall_related_nodes, [node_ids, max_depth, 20])) as Node[]
	}

	private async getNodeContexts(node_ids: number[]) {
		if (node_ids.length === 0) {
			return []
		}

		const articles = (await this.queryRaw(sql_brain.sql_get_node_articles, [node_ids])) as any[]

		return articles.map(article => ({
			article_ids: [article.id],
			relevance_score: 1.0
		}))
	}

	private async stimulateNodes(node_ids: number[], intensity: number) {
		if (node_ids.length === 0 || intensity <= 0) {
			return
		}

		for (const id of node_ids) {
			await this.queryRaw(sql.sql_stimulate, [intensity, id])
		}
	}

	private async strengthenRelatedEdges(args: StrengthenRelatedEdgesArgs) {
		const { matched_nodes, related_nodes } = args
		const node_ids = [...matched_nodes, ...related_nodes].map(n => n.id)

		if (node_ids.length < 2) {
			return
		}

		await this.queryRaw(sql.sql_strengthen_edges_batch, [STRENGTHEN_EDGE_WEIGHT, node_ids, node_ids])
	}

	private async aggregateResults(args: AggregateResultsArgs) {
		const { recall_result, search_results, habits = [] } = args

		const knowledges: Knowledge[] = []
		const actions: Action[] = []

		await this.collectHabitActions(habits, actions)

		this.collectMemoryKnowledges(recall_result, search_results, knowledges)

		this.collectExternalResults(recall_result, search_results, knowledges)

		this.collectImplicitResults(recall_result, knowledges, actions)

		return { knowledges, actions }
	}

	private async collectHabitActions(habits: any[], actions: Action[]) {
		for (const stimulus of habits) {
			if (
				stimulus.similarity > HABIT_REACTION_THRESHOLD &&
				(stimulus.activation >= stimulus.threshold || stimulus.potential >= stimulus.threshold)
			) {
				const strong_habits = (await this.queryRaw(sql.sql_find_strongest_habit, [
					stimulus.id
				])) as any[]

				for (const h of strong_habits) {
					actions.push({
						id: h.target_id,
						content: h.action,
						rerankScore: h.weight,
						relevanceScore: h.weight * 1.5,
						memoryStrength: h.weight,
						combinedScore: 0,
						source: 'memory',
						stimulated: true,
						metadata: h.action_metadata || {}
					})
				}
			}
		}
	}

	private collectMemoryKnowledges(
		recall_result: AggregateResultsArgs['recall_result'],
		search_results: any[],
		knowledges: Knowledge[]
	) {
		for (const context of recall_result.related_contexts) {
			for (const article_id of context.article_ids) {
				const article = search_results.find(r => r.id === article_id)

				if (article) {
					const memory_strength = calculateMemoryStrength(context)

					knowledges.push({
						id: article.id,
						content: article.content,
						rerankScore: article.rerankScore,
						relevanceScore: 1.5,
						memoryStrength: memory_strength,
						combinedScore: 0,
						source: 'memory',
						stimulated: true,
						metadata: (article as any).metadata
					})
				}
			}
		}
	}

	private collectExternalResults(
		recall_result: AggregateResultsArgs['recall_result'],
		search_results: any[],
		knowledges: Knowledge[]
	) {
		const stimulated_node_ids = new Set(recall_result.stimulated_nodes)
		const node_potential_map = new Map<number, number>()

		for (const node of recall_result.nodes) {
			node_potential_map.set(node.id, node.potential)
		}

		for (const result of search_results) {
			if (!knowledges.find(c => c.id === result.id)) {
				const is_stimulated = stimulated_node_ids.has(result.id)
				const memory_strength = node_potential_map.get(result.id) ?? 0

				knowledges.push({
					id: result.id,
					content: result.content,
					rerankScore: result.rerankScore,
					relevanceScore: result.rerankScore,
					memoryStrength: memory_strength,
					combinedScore: 0,
					source: is_stimulated ? 'memory' : 'external',
					stimulated: is_stimulated,
					metadata: (result as any).metadata
				})
			}
		}
	}

	private collectImplicitResults(
		recall_result: AggregateResultsArgs['recall_result'],
		knowledges: Knowledge[],
		actions: Action[]
	) {
		const high_potential_nodes = recall_result.nodes
			.filter(
				n =>
					n.potential > POTENTIAL_THRESHOLD &&
					!knowledges.find(k => k.id === n.id) &&
					!actions.find(a => a.id === n.id)
			)
			.slice(0, MAX_IMPLICIT_RESULTS)

		for (const node of high_potential_nodes) {
			const item = {
				id: node.id,
				content: formatNodeContent(node.label, node.metadata?.desc),
				rerankScore: node.potential,
				relevanceScore: node.potential * RELEVANCE_SCORE_FACTOR,
				memoryStrength: node.potential,
				combinedScore: 0,
				source: 'implicit' as any,
				stimulated: true,
				metadata: node.metadata
			}

			if (node.is_action) {
				actions.push(item)
			} else {
				knowledges.push(item)
			}
		}
	}

	private async rerankKnowledges(query: string, candidates: Knowledge[], limit: number) {
		if (candidates.length === 0) return []

		const documents = candidates.map(c => {
			const source_info = formatSourceInfo(c.source, c.stimulated, c.memoryStrength)

			return `${source_info} [Type: info]\n${c.content}`
		})

		const rerank_scores = await this.pipeline.rerank(query, documents)

		const results: Knowledge[] = candidates.map((candidate, index) => ({
			...candidate,
			rerankScore: rerank_scores[index]?.score ?? 0,
			combinedScore:
				(rerank_scores[index]?.score ?? 0) * RERANK_SCORE_WEIGHT +
				candidate.relevanceScore * RELEVANCE_SCORE_WEIGHT
		}))

		const sorted_results = results.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit)

		await this.stimulateByRanking(sorted_results)

		return sorted_results
	}

	private async rerankActions(query: string, candidates: Action[], limit: number) {
		if (candidates.length === 0) {
			return []
		}

		const documents = candidates.map(c => {
			const source_info = formatSourceInfo(c.source, c.stimulated, c.memoryStrength)

			return `${source_info} [Type: action]\n${c.content}`
		})

		const rerank_scores = await this.pipeline.rerank(query, documents)

		const results: Action[] = candidates.map((candidate, index) => ({
			...candidate,
			rerankScore: rerank_scores[index]?.score ?? 0,
			combinedScore:
				(rerank_scores[index]?.score ?? 0) * RERANK_SCORE_WEIGHT +
				candidate.relevanceScore * RELEVANCE_SCORE_WEIGHT
		}))

		const sorted_results = results.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit)

		await this.stimulateByRanking(sorted_results)

		return sorted_results
	}

	private async stimulateByRanking(results: (Knowledge | Action)[]) {
		if (results.length === 0) return

		const max_stimulation = STIMULATION_MAX
		const min_stimulation = STIMULATION_MIN
		const decay_rate = (max_stimulation - min_stimulation) / Math.max(results.length - 1, 1)
		const stimulation_map = new Map<number, number>()

		for (let i = 0; i < results.length; i++) {
			const intensity = Math.max(max_stimulation - i * decay_rate, min_stimulation)

			stimulation_map.set(results[i].id, intensity)
		}

		const node_ids = Array.from(stimulation_map.keys())
		const intensities = node_ids.map(id => stimulation_map.get(id)!)

		for (let i = 0; i < node_ids.length; i++) {
			await this.queryRaw(sql_brain.sql_stimulate_nodes_batch, [intensities[i], [node_ids[i]]])
		}
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

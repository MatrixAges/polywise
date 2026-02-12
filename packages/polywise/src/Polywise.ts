import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import { singleton, container } from 'tsyringe'
import to from 'await-to-js'
import dayjs from 'dayjs'

import Article from './Article'
import Brain from './Brain'
import Log from './Log'
import Pipeline from './Pipeline'
import Memory from './Memory'
import Cortex from './Cortex'
import * as sql from './sql'
import * as sql_meta from './sql/meta'
import Process from './Process'
import { catchError, catchFinally } from './decorators'
import { CURRENT_SCHEMA_VERSION, migrate, validateMigrations } from './utils/migration'
import extractKeywords from './utils/extractKeywords'
import { aggregateResults } from './utils/aggregation'
import { rerankKnowledges, rerankActions } from './utils/ranking'
import {
	recallNodesByKeywords,
	recallRelatedNodes,
	getNodeContexts,
	stimulateNodes,
	strengthenRelatedEdges
} from './utils/graph'
import { handleHabitReaction, getHabits } from './utils/habits'
import {
	CONSOLIDATION_ACTIVE_THRESHOLD,
	CONSOLIDATION_ENTRY_PREFIX,
	CONSOLIDATION_POTENTIAL_THRESHOLD,
	DEFAULT_EDGE_WEIGHT,
	DEFAULT_NODE_THRESHOLD,
	DEFAULT_RECALL_DEPTH,
	DEFAULT_TIMESTAMP_FORMAT,
	HABIT_CONSOLIDATION_WEIGHT,
	HABIT_LTM_PREFIX,
	MAX_HABIT_CONSOLIDATION,
	MEMORY_RECALL_INTENSITY,
	NO_ACTIVITY_SUMMARY,
	SNAPSHOT_WEIGHT_THRESHOLD,
	getProactiveStatementPrompt
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
	RecallNodesByKeywordsArgs,
	StrengthenRelatedEdgesArgs,
	Action,
	FiltersArgs,
	FinalQueryResult
} from './types'

@singleton()
export default class Polywise {
	public pipeline: Pipeline = container.resolve(Pipeline)
	public article: Article = container.resolve(Article)
	public brain: Brain = container.resolve(Brain)
	public memory: Memory = container.resolve(Memory)
	public cortex: Cortex = container.resolve(Cortex)
	public log: Log = container.resolve(Log)

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
			decision_config,
			embedding_concurrency,
			reranker_concurrency,
			decision_concurrency,
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

		this.db = new PGlite(data_dir || ':polywise:', {
			relaxedDurability: true,
			extensions: { vector }
		})

		await this.initDatabase()

		await this.pipeline.init({
			cache_dir,
			embedding_config,
			reranker_config,
			decision_config,
			embedding_concurrency,
			reranker_concurrency,
			decision_concurrency
		})

		this.article.init(this)
		this.brain.init(this)
		this.memory.init(this)
		this.cortex.init(this)

		if (log) {
			this.log.init(typeof log === 'boolean' ? {} : log)
		}
	}

	process(query: string) {
		const process = new Process(query)

		this.query({ query, process }).catch(err => {
			console.error('Process query error:', err)
			process.emit('error', err)
		})

		return process
	}

	async getLongMemory(args: FiltersArgs = {}) {
		return this.memory.getLongMemory({
			idol_id: args.idol_id ?? this.idol_id ?? undefined,
			root_ids: args.root_ids ?? this.root_ids ?? undefined,
			metrics_ids: args.metrics_ids ?? this.metrics_ids ?? undefined
		})
	}

	async getDailyMemory(timestamp: string, args: FiltersArgs = {}) {
		return await this.memory.getDailyMemory(timestamp, {
			idol_id: args.idol_id ?? this.idol_id ?? undefined,
			root_ids: args.root_ids ?? this.root_ids ?? undefined,
			metrics_ids: args.metrics_ids ?? this.metrics_ids ?? undefined
		})
	}

	async setLongMemory(content: string, args: FiltersArgs = {}) {
		await this.memory.saveLongTerm(content, {
			idol_id: args.idol_id ?? this.idol_id ?? undefined,
			root_ids: args.root_ids ?? this.root_ids ?? undefined,
			metrics_ids: args.metrics_ids ?? this.metrics_ids ?? undefined
		})
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

	async handleHabitReaction(args: {
		query: string
		query_embedding: Array<number>
		initial_actions: Array<Action>
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
			])) as { id: number }[]

			aid = res[0].id
		}

		const query_embedding = ((await this.pipeline.embed(content)) as number[]) || []

		if (query_embedding && query_embedding.length > 0) {
			const existing_embedding = await this.queryRaw(sql.sql_get_article_embedding, [aid])

			if (existing_embedding.length > 0) {
				await this.queryRaw(sql.sql_update_article_embedding, [`[${query_embedding.join(',')}]`, aid])
			} else {
				await this.queryRaw(sql.sql_insert_article_embedding, [aid, `[${query_embedding.join(',')}]`])
			}

			if (await this.isProactiveStatement(content)) {
				await this.memory.saveLongTerm(content, {
					idol_id: idol_id ?? undefined,
					root_ids: root_ids ?? undefined,
					metrics_ids: metrics_ids ?? undefined
				})
			}
		}

		this.log.write({ ...args, idol_id, root_ids, metrics_ids }, { article_id: aid })
	}

	private async isProactiveStatement(content: string) {
		const prompt = getProactiveStatementPrompt(content)

		const decision = await this.pipeline.decide(prompt, { max_new_tokens: 5 })

		const normalized = decision.split('\n')[0].toUpperCase().trim()
		return normalized === 'YES' || normalized.startsWith('YES')
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
		const timestamp = dayjs().format(DEFAULT_TIMESTAMP_FORMAT)
		const logs = this.log.getTodayLogs()
		const summary = logs.length > 0 ? logs.join('\n\n') : NO_ACTIVITY_SUMMARY

		const filters = {
			idol_id: this.idol_id ?? undefined,
			root_ids: this.root_ids ?? undefined,
			metrics_ids: this.metrics_ids ?? undefined
		}

		await this.memory.saveDiary(summary, timestamp, filters)

		await this.consolidateLongTermMemory(filters)

		await this.exec([
			sql.sql_sleep_tick_begin,
			sql.sql_sleep_tick_clean_noise,
			sql.sql_sleep_tick_decay,
			sql.sql_sleep_tick_replay,
			sql.sql_sleep_tick_reset_nodes,
			sql.sql_sleep_tick_commit
		])
	}

	private async consolidateLongTermMemory(filters: FiltersArgs) {
		const snapshot = await this.getSnapshot(1.0)

		const active_nodes = snapshot.nodes.filter(
			n => n.activation > CONSOLIDATION_ACTIVE_THRESHOLD || n.potential > CONSOLIDATION_POTENTIAL_THRESHOLD
		)

		if (active_nodes.length > 0) {
			const core_labels = active_nodes.map(n => n.label).join(', ')
			const consolidation_entry = `${CONSOLIDATION_ENTRY_PREFIX}${core_labels}`

			await this.memory.saveLongTerm(consolidation_entry, filters)
		}

		const habits = (await this.queryRaw(sql.sql_get_strong_habits, [
			HABIT_CONSOLIDATION_WEIGHT,
			MAX_HABIT_CONSOLIDATION
		])) as Array<{ label: string; weight: number }>

		for (const habit of habits) {
			const habit_ltm = `${HABIT_LTM_PREFIX}${habit.label} (Strength: ${habit.weight.toFixed(2)})`

			await this.memory.saveLongTerm(habit_ltm, filters)
		}
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
			process
		} = args

		const query_embedding = (await this.pipeline.embed(query)) as number[]

		const recall_result = await this.recallFromMemory({
			query,
			max_depth: recall_depth,
			stimulate_intensity: stimulate_on_recall ? MEMORY_RECALL_INTENSITY : 0,
			query_embedding: query_embedding ?? undefined,
			idol_id,
			root_ids,
			metrics_ids
		})

		const search_results = await this.pipeline.search({
			query,
			rerank_limit: search_limit,
			vectorSearch: () =>
				this.article.searchByVector({ query, limit: search_limit, idol_id, root_ids, metrics_ids }),
			fulltextSearch: () =>
				this.article.searchByText({ query, limit: search_limit, idol_id, root_ids, metrics_ids })
		})

		const memory_results = await this.memory.search(
			query,
			{
				idol_id: idol_id ?? undefined,
				root_ids: root_ids ?? undefined,
				metrics_ids: metrics_ids ?? undefined
			},
			search_limit
		)

		const habits = await this.getHabits(query_embedding)

		const { knowledges, actions } = await aggregateResults(
			{
				recall_result,
				search_results,
				habits,
				memory_results
			},
			this.queryRaw.bind(this)
		)
		process?.emit('aggregated_results', { knowledges, actions })

		const reranked_knowledges = await rerankKnowledges(
			query,
			knowledges,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this)
		)
		process?.emit('reranked_knowledges', reranked_knowledges)

		const reranked_actions = await rerankActions(
			query,
			actions,
			rerank_limit,
			this.pipeline,
			this.queryRaw.bind(this)
		)
		process?.emit('reranked_actions', reranked_actions)

		return {
			knowledges: reranked_knowledges,
			actions: reranked_actions
		}
	}

	async getHabits(query_embedding: Array<number>) {
		return await getHabits(query_embedding, this.queryRaw.bind(this))
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

	async queryRaw(sql_str: string, params?: Array<any>) {
		const res = params ? await this.db.query(sql_str, params) : await this.db.query(sql_str)

		return JSON.parse(JSON.stringify(res.rows))
	}

	async off() {
		this.brain?.off()
		this.pipeline?.off()

		await this.db.close()

		this.db = null
	}
}

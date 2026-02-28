import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import { container, singleton } from 'tsyringe'

import Activation from './Activation'
import Article from './Article'
import Brain from './Brain'
import Console from './Console'
import {
	AROUSAL_MAX,
	AROUSAL_MIN,
	AROUSAL_OPTIMAL_SIMILARITY,
	AROUSAL_WIDTH,
	CONFLICT_PENALTY_STEP,
	CONFLICT_PENALTY_THRESHOLD,
	CONTEXT_KEYWORDS_LIMIT,
	CONTEXT_QUERY_LIMIT,
	CONTEXT_QUERY_THRESHOLD,
	CONTEXT_SEQUENCE_BRANCH,
	CONTEXT_SEQUENCE_DEPTH,
	CONTEXT_SEQUENCE_HOP_DECAY,
	CONTEXT_SEQUENCE_REPLAY_LIMIT,
	CONTEXT_SEQUENCE_REPLAY_MIN_SCORE,
	CONTEXT_SEQUENCE_REPLAY_STRENGTH,
	CONTEXT_SEQUENCE_TIME_HALF_LIFE_HOURS,
	CONTEXT_SEQUENCE_WINDOW_HOURS,
	CONTEXT_SEQUENCE_WINDOW_PENALTY,
	CONTEXT_SIMILARITY_THRESHOLD,
	DEFAULT_DATA_DIR,
	DEFAULT_EDGE_WEIGHT,
	DEFAULT_NODE_THRESHOLD,
	DEFAULT_RECALL_DEPTH,
	DEFAULT_RERANK_LIMIT,
	DEFAULT_SEARCH_LIMIT,
	DEFAULT_SIMILARITY_THRESHOLD,
	GLOBAL_INHIBITION_MAX,
	INPUT_DECAY_THRESHOLD,
	LOCAL_COMPETITION_EDGE_WEIGHT_MIN,
	LOCAL_COMPETITION_RATIO,
	MAX_ACTIVE_LIMIT,
	MAX_THRESHOLD_DECAY_STEP,
	MEMORY_RECALL_INTENSITY,
	QUERY_KEYWORDS_LIMIT,
	SNAPSHOT_NODES_LIMIT,
	SNAPSHOT_WEIGHT_THRESHOLD,
	SOURCE_CONFIDENCE_BASE,
	SOURCE_CONFIDENCE_FULLTEXT_BONUS,
	SOURCE_CONFIDENCE_HISTORY_WEIGHT,
	SOURCE_CONFIDENCE_MAX,
	SOURCE_CONFIDENCE_MIN,
	SOURCE_CONFIDENCE_RECALL_BONUS,
	SOURCE_CONFIDENCE_RERANK_BONUS,
	SOURCE_CONFIDENCE_VECTOR_BONUS
} from './consts'
import Cortex from './Cortex'
import { catchError, catchFinally } from './decorators'
import Log from './Log'
import Pipeline from './Pipeline'
import Process from './Process'
import {
	sql_add_node,
	sql_connect,
	sql_decay,
	sql_delete_article,
	sql_find_nearest_contexts,
	sql_forget_decay_edges,
	sql_forget_decay_nodes,
	sql_get_active_node_count,
	sql_get_all_nodes,
	sql_get_context_edges_by_source,
	sql_get_edges_by_idol,
	sql_get_edges_by_root,
	sql_get_edges_for_nodes,
	sql_get_input_count,
	sql_get_nodes_by_idol,
	sql_get_nodes_by_ids,
	sql_get_nodes_by_root,
	sql_get_snapshot_edges,
	sql_get_snapshot_nodes,
	sql_get_top_nodes_by_potential,
	sql_increment_input_count,
	sql_inject_edges_begin,
	sql_inject_edges_commit,
	sql_inject_edges_insert_edge,
	sql_inject_edges_rollback,
	sql_inject_edges_update_edge,
	sql_insert_article_embedding,
	sql_insert_context,
	sql_memory_reorganization,
	sql_node_sources,
	sql_process_article,
	sql_propagate,
	sql_reset_input_count,
	sql_run_shadow_tick,
	sql_sleep_tick_begin,
	sql_sleep_tick_clean_noise,
	sql_sleep_tick_commit,
	sql_sleep_tick_decay_edges,
	sql_sleep_tick_decay_nodes,
	sql_sleep_tick_replay,
	sql_stimulate,
	sql_strengthen_edges_by_context,
	sql_update_article_embedding,
	sql_update_article_metadata,
	sql_update_context,
	sql_upsert_context_edge,
	sql_upsert_node
} from './sql'
import { sql_create_schema_meta, sql_create_table_schema_version, sql_get_current_version } from './sql/meta'
import {
	aggregateResults,
	CURRENT_SCHEMA_VERSION,
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
	ContextResult,
	Edge,
	FiltersArgs,
	FinalQueryResult,
	ForgetArticleArgs,
	GetNodeRelatedArgs,
	Memory,
	Metadata,
	Node,
	PolywiseArgs,
	ProcessArticleArgs,
	QueryArgs,
	RecallArgs,
	RecallNodesByKeywordsArgs,
	SingleSearchArgs,
	UpdateArticleArgs
} from './types'

const calculateArousal = (similarity: number) => {
	const clamped_similarity = Math.min(1, Math.max(0, similarity))
	const similarity_delta = clamped_similarity - AROUSAL_OPTIMAL_SIMILARITY
	const variance = AROUSAL_WIDTH * AROUSAL_WIDTH
	const exponent = -(similarity_delta * similarity_delta) / (2 * variance)
	const curve = Math.exp(exponent)
	const arousal = AROUSAL_MIN + (AROUSAL_MAX - AROUSAL_MIN) * curve

	return Math.min(AROUSAL_MAX, Math.max(AROUSAL_MIN, arousal))
}

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
	context_id: string | null = null

	onTick?: () => void

	private is_closed = false
	private last_context_id: string | null = null

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
			context_id,
			onTick
		} = args

		this.idol_id = idol_id ?? null
		this.root_ids = root_ids ?? null
		this.context_id = context_id ?? null

		this.onTick = onTick

		this.db = await PGlite.create(data_dir || DEFAULT_DATA_DIR, {
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

		const on_tick = () => {
			if (this.onTick) {
				this.onTick()
			}
		}

		this.article.init(this)
		this.brain.init({
			tick: this.tick.bind(this),
			trigger_sleep_tick: this.triggerSleepTick.bind(this),
			trigger_memory_reorganization: this.triggerMemoryReorganization.bind(this),
			run_shadow_tick: this.runShadowTick.bind(this),
			on_tick
		})
		this.cortex.init({
			execute_single_search: this.executeSingleSearch.bind(this),
			pipeline: this.pipeline
		})
		this.activation.init({
			query_raw: this.queryRaw.bind(this),
			tick: this.tick.bind(this),
			on_tick
		})

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
			context_id: this.context_id ?? undefined,
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

		const { content, idol_id = this.idol_id, root_ids = this.root_ids, metadata } = args

		Console.log('SYSTEM', 'save start', { content_len: content.length, metadata })

		const vectorResults = await this.article.searchByVector({
			query: content,
			limit: 1,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			context_id: this.context_id ?? undefined,
			threshold: 0
		})
		const max_sim = vectorResults.length > 0 ? vectorResults[0].similarity : 0
		const arousal = calculateArousal(max_sim)

		const keywords = await this.pipeline.generateKeywords(content)
		const query_embedding = ((await this.pipeline.embed(content)) as Array<number>) || []
		const context_keywords = keywords.slice(0, CONTEXT_KEYWORDS_LIMIT)
		const resolved_context_id =
			this.context_id ??
			(await this.resolveContextIdForSave({
				embedding: query_embedding,
				keywords: context_keywords
			}))

		const article_id = generateId()

		const res = (await this.queryRaw(sql_process_article, [
			article_id,
			content,
			idol_id ?? null,
			root_ids ?? null,
			resolved_context_id ?? null,
			JSON.stringify(metadata ?? {})
		])) as Array<{ id: string }>

		const aid = res[0].id

		if (query_embedding && query_embedding.length > 0) {
			const embedding_id = generateId()
			await this.queryRaw(sql_insert_article_embedding, [
				embedding_id,
				aid,
				`[${query_embedding.join(',')}]`
			])
		}

		if (keywords.length > 0) {
			Console.log('SYSTEM', 'keywords injected', { count: keywords.length })
			const node_ids = await this.injectKeywords({
				keywords,
				article_id: aid,
				idol_id,
				root_ids,
				context_id: resolved_context_id
			})

			await this.activation.stimulate(node_ids, 1.0)
			await this.activation.spread(3, DEFAULT_NODE_THRESHOLD, true, arousal)
		}

		this.log.write({ ...args, idol_id, root_ids, context_id: resolved_context_id }, { memory_id: aid })

		await this.updateContextTransition({ context_id: resolved_context_id })

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

		const { memory_id, content, idol_id = this.idol_id, root_ids = this.root_ids, metadata } = args

		Console.log('SYSTEM', 'save start', { content_len: content.length, metadata })

		const vectorResults = await this.article.searchByVector({
			query: content,
			limit: 1,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			context_id: this.context_id ?? undefined,
			threshold: 0
		})
		const max_sim = vectorResults.length > 0 ? vectorResults[0].similarity : 0
		const arousal = calculateArousal(max_sim)
		const keywords = await this.pipeline.generateKeywords(content)
		const query_embedding = ((await this.pipeline.embed(content)) as Array<number>) || []
		const context_keywords = keywords.slice(0, CONTEXT_KEYWORDS_LIMIT)
		const resolved_context_id =
			this.context_id ??
			(await this.resolveContextIdForSave({
				embedding: query_embedding,
				keywords: context_keywords
			}))
		let merged_metadata = metadata

		if (metadata && Object.keys(metadata).length > 0) {
			const existing_articles = await this.article.get(memory_id)
			const existing_metadata = (existing_articles?.[0]?.metadata ?? {}) as Metadata

			merged_metadata = { ...existing_metadata, ...metadata }
		}

		await this.queryRaw(sql_forget_decay_nodes, [memory_id])
		await this.queryRaw(sql_forget_decay_edges, [memory_id])

		await this.article.update(memory_id, {
			content,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			context_id: resolved_context_id ?? undefined,
			metadata: merged_metadata
		})

		if (query_embedding && query_embedding.length > 0) {
			await this.queryRaw(sql_update_article_embedding, [`[${query_embedding.join(',')}]`, memory_id])
		}

		if (keywords.length > 0) {
			const node_ids = await this.injectKeywords({
				keywords,
				article_id: memory_id,
				idol_id,
				root_ids,
				context_id: resolved_context_id
			})

			await this.activation.stimulate(node_ids, 1.0)
			await this.activation.spread(3, DEFAULT_NODE_THRESHOLD, true, arousal)
		}

		this.log.write({ ...args, idol_id, root_ids, context_id: resolved_context_id }, { memory_id })

		await this.updateContextTransition({ context_id: resolved_context_id })

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

		const { memory_id, query, idol_id, root_ids, context_id } = args

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
				context_id: context_id ?? this.context_id ?? undefined
			})

			for (const item of result.memory) {
				memory_ids_to_delete.add(item.memory_id)
			}
		}

		for (const id of memory_ids_to_delete) {
			await this.queryRaw(sql_forget_decay_nodes, [id])
			await this.queryRaw(sql_forget_decay_edges, [id])
			await this.queryRaw(sql_delete_article, [id, idol_id ?? null, root_ids ?? null, context_id ?? null])
		}
	}

	private setFilters(args: FiltersArgs) {
		const { idol_id, root_ids, context_id } = args

		if (idol_id !== undefined) this.idol_id = idol_id
		if (root_ids !== undefined) this.root_ids = root_ids
		if (context_id !== undefined) this.context_id = context_id
	}

	private process(query: string) {
		const process = new Process(query)

		this.query({ query, process }).catch(err => {
			console.error('Process query error:', err)
			process.emit('error', err)
		})

		return process
	}

	private async addNode(args: AddNodeArgs) {
		const {
			label,
			x,
			y,
			threshold,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			context_id = this.context_id,
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
			context_id ?? null,
			embedding ? `[${embedding.join(',')}]` : null,
			article_ids ?? null,
			lock ?? false
		])) as Array<{ id: string }>

		return rows[0].id
	}

	private async connect(args: ConnectArgs) {
		const {
			source_id,
			target_id,
			weight,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			context_id = this.context_id,
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
			context_id ?? null,
			lock ?? false
		])
	}

	private async injectKeywords(args: {
		keywords: Array<string>
		article_id: string
		idol_id?: string | null
		root_ids?: Array<string> | null
		context_id?: string | null
	}) {
		const { keywords, article_id, idol_id, root_ids, context_id } = args

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
					context_id,
					article_ids: [article_id]
				})
				node_ids.push(id)
				await this.queryRaw(sql_node_sources, [id, article_id])
			}

			for (let i = 0; i < node_ids.length - 1; i++) {
				const sub_id = node_ids[i]
				const obj_id = node_ids[i + 1]

				await this.queryRaw(
					sql_inject_edges_insert_edge(sub_id, obj_id, 1.0, 1.0, 0.5, idol_id, root_ids, context_id)
				)

				await this.queryRaw(
					sql_inject_edges_update_edge(sub_id, obj_id, 1.0, 1.0, 0.1, idol_id, root_ids, context_id)
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
		context_id?: string | null
		article_ids?: Array<string> | null
		lock?: boolean
	}) {
		const { label, idol_id, root_ids, context_id, article_ids, lock } = args
		const node_id = generateId()

		const rows = (await this.queryRaw(sql_upsert_node, [
			node_id,
			label,
			idol_id ?? null,
			root_ids ?? null,
			context_id ?? null,
			null,
			article_ids ?? null,
			lock ?? false
		])) as Array<{ id: string }>

		return rows[0].id
	}

	/**
	 * Injects potential (energy) into a specific node.
	 * This increases the node's `potential` (analog state).
	 * If the potential crosses the node's threshold, it will trigger an `Activation` (digital event) in the next tick.
	 */
	private async stimulate(node_id: string, intensity = 1.0) {
		await this.queryRaw(sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = SNAPSHOT_WEIGHT_THRESHOLD, limit = SNAPSHOT_NODES_LIMIT) {
		Console.log('SYSTEM', 'getSnapshot start', { weight_threshold, limit })

		const SEED_NODES = 3

		const seed_nodes = (await this.queryRaw(sql_get_top_nodes_by_potential(SEED_NODES))) as Array<Node>

		Console.log('SYSTEM', 'getSnapshot seed nodes', { count: seed_nodes.length })

		if (seed_nodes.length === 0) {
			return { nodes: [], edges: [] }
		}

		const all_nodes_map = new Map<string, Node>()
		const all_edges_map = new Map<string, Edge>()

		const initial_node_ids = seed_nodes.map(n => n.id)
		initial_node_ids.forEach(id => all_nodes_map.set(id, seed_nodes.find(n => n.id === id)!))

		let frontier_node_ids = initial_node_ids
		const max_iterations = 10

		for (let iteration = 0; iteration < max_iterations; iteration++) {
			if (all_nodes_map.size >= limit) break
			if (frontier_node_ids.length === 0) break

			const edges = (await this.queryRaw(sql_get_edges_for_nodes, [frontier_node_ids])) as Array<Edge>

			Console.log('SYSTEM', 'getSnapshot iteration edges', { iteration, count: edges.length })

			if (edges.length === 0) break

			edges.forEach(edge => {
				const key = `${edge.source_id}_${edge.target_id}`
				if (!all_edges_map.has(key)) {
					all_edges_map.set(key, edge)
				}
			})

			const connected_node_idsSet = new Set<string>()
			edges.forEach(edge => {
				if (!all_nodes_map.has(edge.source_id)) {
					connected_node_idsSet.add(edge.source_id)
				}
				if (!all_nodes_map.has(edge.target_id)) {
					connected_node_idsSet.add(edge.target_id)
				}
			})

			const connected_node_ids = Array.from(connected_node_idsSet)

			if (connected_node_ids.length === 0) break

			const new_nodes = (await this.queryRaw(sql_get_nodes_by_ids, [connected_node_ids])) as Array<Node>

			Console.log('SYSTEM', 'getSnapshot iteration nodes', { iteration, count: new_nodes.length })

			new_nodes.forEach(node => {
				if (!all_nodes_map.has(node.id)) {
					all_nodes_map.set(node.id, node)
				}
			})

			if (all_nodes_map.size >= limit) break

			frontier_node_ids = connected_node_ids.slice(0, limit - all_nodes_map.size)
		}

		const result_nodes = Array.from(all_nodes_map.values()).slice(0, limit)
		const result_edges = Array.from(all_edges_map.values())

		if (result_nodes.length <= SEED_NODES) {
			const snapshot_nodes = (await this.queryRaw(
				sql_get_snapshot_nodes(weight_threshold, limit)
			)) as Array<Node>
			const snapshot_edges = (await this.queryRaw(sql_get_snapshot_edges(weight_threshold))) as Array<Edge>

			for (const node of snapshot_nodes) {
				if (!all_nodes_map.has(node.id)) {
					all_nodes_map.set(node.id, node)
				}
			}

			for (const edge of snapshot_edges) {
				const key = `${edge.source_id}_${edge.target_id}`
				if (all_edges_map.has(key)) continue

				if (!all_nodes_map.has(edge.source_id)) continue
				if (!all_nodes_map.has(edge.target_id)) continue

				all_edges_map.set(key, edge)
			}

			const fallback_nodes = Array.from(all_nodes_map.values()).slice(0, limit)
			const fallback_edges = Array.from(all_edges_map.values())

			Console.log('SYSTEM', 'getSnapshot fallback', {
				nodes: fallback_nodes.length,
				edges: fallback_edges.length
			})

			return { nodes: fallback_nodes, edges: fallback_edges }
		}

		Console.log('SYSTEM', 'getSnapshot done', {
			nodes: result_nodes.length,
			edges: result_edges.length
		})

		return { nodes: result_nodes, edges: result_edges }
	}

	private async getAllNodes() {
		return (await this.queryRaw(sql_get_all_nodes)) as Array<Node>
	}

	private async getNodesByIdol(idol_id: string) {
		return (await this.queryRaw(sql_get_nodes_by_idol, [idol_id])) as Array<Node>
	}

	private async getNodesByRoot(root_id: string) {
		return (await this.queryRaw(sql_get_nodes_by_root, [root_id])) as Array<Node>
	}

	private async getEdgesByIdol(idol_id: string) {
		return (await this.queryRaw(sql_get_edges_by_idol, [idol_id])) as Array<Edge>
	}

	private async getEdgesByRoot(root_id: string) {
		return (await this.queryRaw(sql_get_edges_by_root, [root_id])) as Array<Edge>
	}

	/**
	 * Executes a simulation tick for the neural network.
	 *
	 * Biological Mechanism:
	 * 1. Integrate: Nodes accumulate potential from incoming signals.
	 * 2. Fire: If potential > node.threshold (Activation), the node fires (is_active=true).
	 * 3. Propagate: Active nodes send signals to neighbors via edges.
	 * 4. Reset: Active nodes enter a refractory period (potential resets).
	 * 5. Decay: Inactive nodes lose potential over time (Leak).
	 */
	private async tick(threshold_override?: number, is_learning: boolean = false, arousal: number = 1.0) {
		const threshold = threshold_override ?? DEFAULT_NODE_THRESHOLD

		// Calculate System Heat (Homeostatic Plasticity)
		const active_res = (await this.queryRaw(sql_get_active_node_count)) as Array<{ count: number }>
		const active_count = active_res[0]?.count ?? 0
		const heat = Math.min(1.0, active_count / MAX_ACTIVE_LIMIT)
		const threshold_decrement = MAX_THRESHOLD_DECAY_STEP * (1.0 - heat)
		const inhibition_factor = Math.min(GLOBAL_INHIBITION_MAX, Math.max(0, heat * GLOBAL_INHIBITION_MAX))

		await this.exec(sql_propagate(threshold, threshold_decrement, is_learning, arousal, inhibition_factor))

		await this.queryRaw(sql_increment_input_count)

		const count_res = (await this.queryRaw(sql_get_input_count)) as Array<{ value: number }>
		const count = count_res[0]?.value ?? 0

		if (count > INPUT_DECAY_THRESHOLD) {
			await this.exec(sql_decay)
			await this.exec(sql_reset_input_count)
		}
	}

	private async runShadowTick() {
		await this.exec(sql_run_shadow_tick)

		await this.tick(0.8, true, 0.5)
	}

	private async triggerSleepTick() {
		Console.log('SYSTEM', 'triggerSleepTick start')

		const active_res = (await this.queryRaw(sql_get_active_node_count)) as Array<{ count: number }>
		const active_count = active_res[0]?.count ?? 0

		Console.log('SYSTEM', 'triggerSleepTick check', { active_count, limit: MAX_ACTIVE_LIMIT })

		const is_overloaded = active_count > MAX_ACTIVE_LIMIT

		if (!is_overloaded) {
			Console.log('SYSTEM', 'triggerSleepTick skipped - not overloaded')
			return
		}

		Console.log('SYSTEM', 'triggerSleepTick executing - cognitive overload detected')

		const sequence_scores = await this.getContextSequenceScores()
		const filtered_scores = sequence_scores.filter(
			score_item => score_item.score >= CONTEXT_SEQUENCE_REPLAY_MIN_SCORE
		)
		const selected_scores = filtered_scores.slice(0, CONTEXT_SEQUENCE_REPLAY_LIMIT)
		const context_ids = selected_scores.map(score_item => score_item.context_id)
		const context_scores = selected_scores.map(score_item => score_item.score)

		await this.exec(sql_sleep_tick_begin)
		await this.exec(sql_sleep_tick_clean_noise)
		await this.exec(sql_sleep_tick_decay_nodes)
		await this.exec(sql_sleep_tick_decay_edges)

		await this.queryRaw(sql_sleep_tick_replay, [context_ids, context_scores])

		await this.exec(sql_sleep_tick_commit)

		Console.log('SYSTEM', 'triggerSleepTick completed')
	}

	private async getActiveNodeCount() {
		const result = (await this.queryRaw(sql_get_active_node_count)) as Array<{ count: number }>
		return result[0]?.count ?? 0
	}

	private async triggerMemoryReorganization() {
		await this.exec(sql_memory_reorganization)

		await this.applyContextSequenceReplay()
	}

	async getNodeRelated(args: GetNodeRelatedArgs) {
		const { node_id, depth = 1, limit = 20 } = args

		const related_nodes = await this.recallRelatedNodes({
			node_ids: [node_id],
			max_depth: depth,
			limit,
			context_id: this.context_id ?? undefined
		})
		const all_node_ids = Array.from(new Set([node_id, ...related_nodes.map(n => n.id)]))
		const edges = await this.getEdgesBetweenNodes(all_node_ids)

		return {
			nodes: related_nodes,
			edges
		}
	}

	async recall(args: RecallArgs) {
		this.log.write({ query: args.query }, { event: 'recall_start' })

		const {
			query,
			max_depth = DEFAULT_RECALL_DEPTH,
			stimulate_intensity = MEMORY_RECALL_INTENSITY,
			idol_id = this.idol_id,
			root_ids = this.root_ids,
			limit = 20,
			is_learning = false,
			arousal = 1.0,
			query_embedding
		} = args

		let resolved_context_id = this.context_id

		if (!resolved_context_id) {
			const recall_embedding =
				query_embedding && query_embedding.length > 0
					? query_embedding
					: ((await this.pipeline.embed(query)) as Array<number>)

			resolved_context_id = await this.resolveContextIdForQuery({ embedding: recall_embedding })
		}

		const query_keywords = await this.pipeline.generateKeywords(query)
		const recall_keywords = query_keywords.slice(0, QUERY_KEYWORDS_LIMIT)

		const matched_nodes = await this.recallNodesByKeywords({
			keywords: recall_keywords,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			context_id: resolved_context_id ?? undefined,
			limit
		})

		const related_nodes = await this.recallRelatedNodes({
			node_ids: matched_nodes.map(n => n.id),
			max_depth,
			limit,
			context_id: resolved_context_id ?? undefined
		})

		const all_nodes = [...matched_nodes]
		const matched_ids = new Set(matched_nodes.map(n => n.id))

		for (const node of related_nodes) {
			if (!matched_ids.has(node.id)) {
				all_nodes.push(node)
				matched_ids.add(node.id)
			}
		}

		const all_edges = await this.getEdgesBetweenNodes(all_nodes.map(n => n.id))
		const { selected_nodes, filtered_related_nodes } = this.applyLocalCompetition({
			matched_nodes,
			related_nodes,
			edges: all_edges
		})
		const selected_ids = new Set(selected_nodes.map(node => node.id))
		const selected_edges = all_edges.filter(
			edge => selected_ids.has(edge.source_id) && selected_ids.has(edge.target_id)
		)

		if (stimulate_intensity > 0) {
			const node_ids = selected_nodes.map(node => node.id)

			await this.activation.stimulate(node_ids, stimulate_intensity)
			if (is_learning) {
				await this.activation.strengthen({ matched_nodes, related_nodes: filtered_related_nodes })
			}
			await this.activation.spread(3, DEFAULT_NODE_THRESHOLD, is_learning, arousal)
		}

		const contexts = await this.getNodeContexts(selected_nodes.map(node => node.id))

		return {
			nodes: selected_nodes,
			edges: selected_edges,
			stimulated_nodes: selected_nodes.map(node => node.id),
			related_contexts: contexts
		}
	}

	private async executeSingleSearch(args: SingleSearchArgs) {
		const {
			query,
			recall_depth = DEFAULT_RECALL_DEPTH,
			search_limit = DEFAULT_SEARCH_LIMIT,
			rerank_limit = DEFAULT_RERANK_LIMIT,
			stimulate_on_recall = false,
			idol_id,
			root_ids,
			process,
			threshold = DEFAULT_SIMILARITY_THRESHOLD
		} = args

		Console.log('SEARCH', 'executeSingleSearch start', { query })

		const query_embedding = (await this.pipeline.embed(query)) as Array<number>
		const sequence_context_id = await this.getSequentialContext()
		const resolved_context_id =
			this.context_id ?? (await this.resolveContextIdForQuery({ embedding: query_embedding }))

		if (resolved_context_id) {
			this.last_context_id = resolved_context_id
		}

		Console.log('SEARCH', 'recall start')
		const recall_result = await this.recall({
			query,
			max_depth: recall_depth,
			stimulate_intensity: stimulate_on_recall ? MEMORY_RECALL_INTENSITY : 0,
			query_embedding: query_embedding ?? undefined,
			idol_id,
			root_ids,
			context_id: resolved_context_id ?? undefined
		})

		Console.log('SEARCH', 'article.searchByVector start')
		const vectorResults = await this.article.searchByVector({
			query,
			limit: search_limit,
			idol_id,
			root_ids,
			context_id: undefined,
			threshold
		})
		process?.emit('vector_search_results', vectorResults)

		Console.log('SEARCH', 'article.searchByText start')
		const fulltextResults = await this.article.searchByText({
			query,
			limit: search_limit,
			idol_id,
			root_ids,
			context_id: undefined
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
			search_results,
			sequence_context_id
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
		await this.updateSourceConfidence({
			memory: reranked_memory,
			vector_results: vectorResults,
			fulltext_results: fulltextResults,
			recall_contexts: recall_result.related_contexts,
			threshold
		})

		return {
			memory: reranked_memory
		}
	}

	private async queryRaw<T = any>(sql_str: string, params?: Array<any>): Promise<Array<T>> {
		if (!this.db || this.is_closed) {
			Console.log('SYSTEM', 'DB not ready for query', { is_closed: this.is_closed })

			throw new Error('DB not initialized or already closed')
		}

		Console.log('SQL', 'queryRaw start', { sql: sql_str.substring(0, 500) })

		try {
			const result = await this.db.query<T>(sql_str, params)

			Console.log('SQL', 'queryRaw done', { row_count: result.rows.length })

			return result.rows
		} catch (error) {
			Console.log('SQL', 'queryRaw error', {
				sql: sql_str.substring(0, 500),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			})

			throw error
		}
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

	private async recallRelatedNodes(args: {
		node_ids: Array<string>
		max_depth: number
		limit: number
		context_id?: string | null
	}) {
		const { node_ids, max_depth, limit, context_id } = args

		return await recallRelatedNodes({
			node_ids,
			max_depth,
			query_raw: this.queryRaw.bind(this),
			limit,
			context_id
		})
	}

	private async getEdgesBetweenNodes(node_ids: Array<string>) {
		return await getEdgesBetweenNodes(node_ids, this.queryRaw.bind(this))
	}

	private async getNodeContexts(node_ids: Array<string>) {
		return await getNodeContexts(node_ids, this.queryRaw.bind(this))
	}

	private async resolveContextIdForSave(args: { embedding: Array<number>; keywords: Array<string> }) {
		const { embedding, keywords } = args

		if (!embedding || embedding.length === 0) {
			return 'global'
		}

		const context_candidates = await this.findNearestContexts({
			embedding,
			limit: 1
		})
		const best_context = context_candidates[0]
		const trimmed_keywords = keywords.slice(0, CONTEXT_KEYWORDS_LIMIT)

		if (best_context && best_context.similarity >= CONTEXT_SIMILARITY_THRESHOLD) {
			await this.updateContext({
				context_id: best_context.id,
				embedding,
				keywords: trimmed_keywords
			})

			return best_context.id
		}

		return await this.createContext({ embedding, keywords: trimmed_keywords })
	}

	private async resolveContextIdForQuery(args: { embedding: Array<number> }) {
		const { embedding } = args

		if (!embedding || embedding.length === 0) {
			return null
		}

		const context_candidates = await this.findNearestContexts({
			embedding,
			limit: CONTEXT_QUERY_LIMIT
		})
		const best_context = context_candidates[0]

		if (!best_context || best_context.similarity < CONTEXT_QUERY_THRESHOLD) {
			return await this.getSequentialContext()
		}

		return best_context.id
	}

	private async getContextSequenceScores() {
		if (!this.last_context_id) {
			return []
		}

		const scores = new Map<string, number>()
		const path_ids = new Set<string>()
		path_ids.add(this.last_context_id)

		await this.collectSequenceScores({
			source_id: this.last_context_id,
			depth: CONTEXT_SEQUENCE_DEPTH,
			step: 0,
			base_score: 1,
			scores,
			path_ids
		})

		const sorted_scores = Array.from(scores.entries()).sort(
			(left_entry, right_entry) => right_entry[1] - left_entry[1]
		)

		return sorted_scores.map(([context_id, score]) => ({ context_id, score }))
	}

	private async getSequentialContext() {
		const sequence_scores = await this.getContextSequenceScores()

		if (sequence_scores.length === 0) {
			return this.last_context_id
		}

		return sequence_scores[0]?.context_id ?? this.last_context_id
	}

	private async applyContextSequenceReplay() {
		const sequence_scores = await this.getContextSequenceScores()

		if (sequence_scores.length === 0) {
			return
		}

		const filtered_scores = sequence_scores.filter(
			score_item => score_item.score >= CONTEXT_SEQUENCE_REPLAY_MIN_SCORE
		)

		if (filtered_scores.length === 0) {
			return
		}

		const selected_scores = filtered_scores.slice(0, CONTEXT_SEQUENCE_REPLAY_LIMIT)
		let max_score = 0

		for (const score_item of selected_scores) {
			if (score_item.score > max_score) {
				max_score = score_item.score
			}
		}

		if (max_score <= 0) {
			return
		}

		for (const score_item of selected_scores) {
			const replay_strength = CONTEXT_SEQUENCE_REPLAY_STRENGTH * (score_item.score / max_score)

			await this.queryRaw(sql_strengthen_edges_by_context, [replay_strength, [score_item.context_id]])
		}
	}

	private async collectSequenceScores(args: {
		source_id: string
		depth: number
		step: number
		base_score: number
		scores: Map<string, number>
		path_ids: Set<string>
	}) {
		const { source_id, depth, step, base_score, scores, path_ids } = args

		if (step >= depth) {
			return
		}

		const edges = (await this.queryRaw(sql_get_context_edges_by_source, [
			source_id,
			CONTEXT_SEQUENCE_BRANCH
		])) as Array<{ target_id: string; weight: number; updated_at?: string }>

		if (edges.length === 0) {
			return
		}

		const hop_decay = Math.pow(CONTEXT_SEQUENCE_HOP_DECAY, step)

		await this.applySequenceEdges({
			edges,
			depth,
			step,
			base_score,
			hop_decay,
			scores,
			path_ids
		})
	}

	private async applySequenceEdges(args: {
		edges: Array<{ target_id: string; weight: number; updated_at?: string }>
		depth: number
		step: number
		base_score: number
		hop_decay: number
		scores: Map<string, number>
		path_ids: Set<string>
	}) {
		const { edges, depth, step, base_score, hop_decay, scores, path_ids } = args

		for (const edge of edges) {
			if (!edge.target_id) continue

			const edge_weight = this.calculateContextEdgeWeight(edge)
			if (edge_weight <= 0) continue

			const score = base_score * edge_weight * hop_decay
			const previous_score = scores.get(edge.target_id) ?? 0
			scores.set(edge.target_id, previous_score + score)

			if (step + 1 >= depth) continue
			if (path_ids.has(edge.target_id)) continue

			path_ids.add(edge.target_id)
			await this.collectSequenceScores({
				source_id: edge.target_id,
				depth,
				step: step + 1,
				base_score: base_score * edge_weight,
				scores,
				path_ids
			})
			path_ids.delete(edge.target_id)
		}
	}

	private calculateContextEdgeWeight(edge: { weight?: number; updated_at?: string }) {
		const base_weight = typeof edge.weight === 'number' ? edge.weight : 0

		if (base_weight <= 0) {
			return 0
		}

		const updated_at = edge.updated_at ? new Date(edge.updated_at).getTime() : Date.now()
		const elapsed_hours = Math.max(0, (Date.now() - updated_at) / 3600000)
		const half_life = Math.max(CONTEXT_SEQUENCE_TIME_HALF_LIFE_HOURS, 1)
		const window_hours = Math.max(CONTEXT_SEQUENCE_WINDOW_HOURS, 1)
		const time_decay = Math.pow(0.5, elapsed_hours / half_life)
		const window_count = Math.floor(elapsed_hours / window_hours)
		const window_decay = Math.pow(CONTEXT_SEQUENCE_WINDOW_PENALTY, window_count)

		return base_weight * time_decay * window_decay
	}

	private async findNearestContexts(args: { embedding: Array<number>; limit: number }) {
		const { embedding, limit } = args

		const embedding_value = `[${embedding.join(',')}]`

		return (await this.queryRaw(sql_find_nearest_contexts, [embedding_value, limit])) as Array<{
			id: string
			similarity: number
		}>
	}

	private async createContext(args: { embedding: Array<number>; keywords: Array<string> }) {
		const { embedding, keywords } = args
		const context_id = generateId()
		const embedding_value = `[${embedding.join(',')}]`

		await this.queryRaw(sql_insert_context, [context_id, embedding_value, keywords, 1])

		return context_id
	}

	private async updateContext(args: { context_id: string; embedding: Array<number>; keywords: Array<string> }) {
		const { context_id, embedding, keywords } = args
		const embedding_value = `[${embedding.join(',')}]`

		await this.queryRaw(sql_update_context, [context_id, embedding_value, keywords])
	}

	private async updateContextTransition(args: { context_id: string | null }) {
		const { context_id } = args

		if (!context_id) {
			return
		}

		if (this.last_context_id && this.last_context_id !== context_id) {
			await this.queryRaw(sql_upsert_context_edge, [this.last_context_id, context_id])
		}

		this.last_context_id = context_id
	}

	private async updateSourceConfidence(args: {
		memory: Array<Memory>
		vector_results: Array<{ id: string }>
		fulltext_results: Array<{ id: string }>
		recall_contexts: Array<ContextResult>
		threshold: number
	}) {
		const { memory, vector_results, fulltext_results, recall_contexts, threshold } = args
		const vector_ids = new Set(vector_results.map(result => result.id))
		const fulltext_ids = new Set(fulltext_results.map(result => result.id))
		const recall_ids = new Set<string>()

		for (const context of recall_contexts) {
			for (const article_id of context.article_ids) {
				recall_ids.add(article_id)
			}
		}

		const now = new Date().toISOString()

		for (const item of memory) {
			let evidence_confidence = SOURCE_CONFIDENCE_BASE
			const is_vector = vector_ids.has(item.id)
			const is_fulltext = fulltext_ids.has(item.id)
			const is_recall = recall_ids.has(item.id)
			const is_rerank_strong = item.score >= threshold

			if (is_vector) evidence_confidence += SOURCE_CONFIDENCE_VECTOR_BONUS
			if (is_fulltext) evidence_confidence += SOURCE_CONFIDENCE_FULLTEXT_BONUS
			if (is_recall) evidence_confidence += SOURCE_CONFIDENCE_RECALL_BONUS
			if (is_rerank_strong) evidence_confidence += SOURCE_CONFIDENCE_RERANK_BONUS

			const conflict_score = Math.max(0, item.memoryStrength - item.score)
			const conflict_flag = conflict_score > CONFLICT_PENALTY_THRESHOLD

			if (conflict_flag) {
				evidence_confidence -= CONFLICT_PENALTY_STEP
			}

			const base_metadata = (item.metadata ?? {}) as Metadata
			const raw_previous_confidence = base_metadata.source_confidence
			const previous_confidence =
				typeof raw_previous_confidence === 'number' ? raw_previous_confidence : SOURCE_CONFIDENCE_BASE
			const normalized_previous = Math.min(
				SOURCE_CONFIDENCE_MAX,
				Math.max(SOURCE_CONFIDENCE_MIN, previous_confidence)
			)
			const normalized_evidence = Math.min(
				SOURCE_CONFIDENCE_MAX,
				Math.max(SOURCE_CONFIDENCE_MIN, evidence_confidence)
			)
			const blended_confidence =
				normalized_previous * SOURCE_CONFIDENCE_HISTORY_WEIGHT +
				normalized_evidence * (1 - SOURCE_CONFIDENCE_HISTORY_WEIGHT)
			const normalized_confidence = Math.min(
				SOURCE_CONFIDENCE_MAX,
				Math.max(SOURCE_CONFIDENCE_MIN, blended_confidence)
			)
			const conflict_count =
				typeof base_metadata.conflict_count === 'number' ? base_metadata.conflict_count : 0
			const updated_metadata: Metadata = {
				...base_metadata,
				source_confidence: normalized_confidence,
				conflict_score,
				conflict_count: conflict_count + (conflict_flag ? 1 : 0),
				last_verified_at: now
			}

			item.metadata = updated_metadata

			await this.queryRaw(sql_update_article_metadata, [item.id, JSON.stringify(updated_metadata)])
		}
	}

	private applyLocalCompetition(args: {
		matched_nodes: Array<Node>
		related_nodes: Array<Node>
		edges: Array<Edge>
	}) {
		const { matched_nodes, related_nodes, edges } = args
		const node_map = new Map<string, Node>()

		for (const node of matched_nodes) {
			node_map.set(node.id, node)
		}

		for (const node of related_nodes) {
			node_map.set(node.id, node)
		}

		const neighbor_map = new Map<string, Array<string>>()

		for (const edge of edges) {
			if (edge.weight < LOCAL_COMPETITION_EDGE_WEIGHT_MIN) continue

			const source_neighbors = neighbor_map.get(edge.source_id) ?? []
			source_neighbors.push(edge.target_id)
			neighbor_map.set(edge.source_id, source_neighbors)

			const target_neighbors = neighbor_map.get(edge.target_id) ?? []
			target_neighbors.push(edge.source_id)
			neighbor_map.set(edge.target_id, target_neighbors)
		}

		const inhibited_ids = new Set<string>()

		for (const node of related_nodes) {
			const neighbors = neighbor_map.get(node.id) ?? []
			let max_neighbor_potential = 0

			for (const neighbor_id of neighbors) {
				const neighbor = node_map.get(neighbor_id)
				const neighbor_potential = neighbor?.potential ?? 0

				if (neighbor_potential > max_neighbor_potential) {
					max_neighbor_potential = neighbor_potential
				}
			}

			const node_potential = node.potential ?? 0

			if (max_neighbor_potential > 0 && node_potential < max_neighbor_potential * LOCAL_COMPETITION_RATIO) {
				inhibited_ids.add(node.id)
			}
		}

		const matched_ids = new Set(matched_nodes.map(node => node.id))
		const selected_nodes = Array.from(node_map.values()).filter(
			node => matched_ids.has(node.id) || !inhibited_ids.has(node.id)
		)
		const filtered_related_nodes = selected_nodes.filter(node => !matched_ids.has(node.id))

		return { selected_nodes, filtered_related_nodes }
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

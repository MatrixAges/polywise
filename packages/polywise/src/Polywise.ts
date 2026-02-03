import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import { singleton } from 'tsyringe'

import Article from './Article'
import Brain from './Brain'
import Pipeline from './Pipeline'
import * as sql from './sql'
import * as sql_brain from './sql/Brain'
import * as sql_meta from './sql/meta'
import { calculateWeight, ChainEmitter, CURRENT_SCHEMA_VERSION, migrate, validateMigrations } from './utils'
import { formatNodeContent, formatSourceInfo, formatPerceiveQuery, SCHEMA_BRAIN, SCHEMA_KNOWLEDGE } from './consts'

import type {
	AddNodeArgs,
	AggregatedCandidate,
	ConnectArgs,
	COTDepthResult,
	Edge,
	HybridSearchResult,
	InjectTriplesArgs,
	MemoryRecallResult,
	Node,
	PolywiseArgs,
	ProcessArticleArgs,
	QueryArgs,
	RecallArgs,
	SearchResult,
	UpsertNodeArgs,
	SingleSearchArgs,
	ExecuteCotArgs,
	RecallNodesByKeywordsArgs,
	StrengthenRelatedEdgesArgs,
	ContextResult,
	ReactArgs,
	ReactResult
} from './types'

@singleton()
export default class Polywise {
	private db: PGlite | null = null

	private _onAction: ((result: ReactResult) => void) | null = null

	public article: Article
	public brain: Brain
	public pipeline: Pipeline

	constructor() {
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
			onTick
		} = args

		this.db = new PGlite(data_dir || ':polywise:', {
			relaxedDurability: true,
			extensions: { vector }
		})

		await this.pipeline.init({
			cache_dir,
			embedding_config,
			reranker_config,
			embedding_concurrency,
			reranker_concurrency
		})

		this.article.init({
			db: this.db
		})

		this.brain.init({
			poly: this,
			onTick
		})

		try {
			validateMigrations()
		} catch (e) {
			console.error('Migration validation error:', e)
		}

		try {
			await this.exec(sql_meta.sql_create_schema_meta)
			await this.exec(sql_meta.sql_create_table_schema_version)

			const version_result = await this.query_raw<{ version: number }>(sql_meta.sql_get_current_version)

			const current_version = version_result[0]?.version ?? 0

			if (current_version < CURRENT_SCHEMA_VERSION) {
				await migrate(current_version, this.exec.bind(this), this.query_raw.bind(this))
			}

			const check_result = await this.query_raw<{ count: string }>(
				`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '${SCHEMA_KNOWLEDGE}' AND table_name = 'articles'`
			)

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
		} catch (e) {
			console.error('Migration error:', e)
		}
	}

	public onAction(cb: (result: ReactResult) => void) {
		this._onAction = cb
	}

	async query(args: QueryArgs) {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		try {
			const {
				query,
				recall_depth = 2,
				search_limit = 20,
				rerank_limit = 10,
				cot_depth = 0,
				stimulate_on_recall = true
			} = args

			const emitter = new ChainEmitter()

			const initial_results = await this.executeSingleSearch({
				query,
				recall_depth,
				search_limit,
				rerank_limit,
				stimulate_on_recall
			})

			if (cot_depth <= 0) {
				return { result: initial_results, cot: emitter }
			}

			this.executeCot({
				query,
				current_depth: 1,
				max_depth: cot_depth,
				base_recall_depth: recall_depth,
				search_limit,
				rerank_limit,
				stimulate_on_recall,
				initial_results,
				emitter,
				history_ids: new Set(initial_results.map(r => r.id))
			})

			return { result: initial_results, cot: emitter }
		} finally {
			this.brain.setBusy(false)
		}
	}

	public async react(input: string, args: ReactArgs = {}): Promise<ReactResult | null> {
		this.brain.reportUserActivity()

		const { habit_threshold = 0.5 } = args

		const embedding = await this.pipeline.embed(input)

		if (!embedding) return null

		const nearest_stimulus = await this.query_raw<any[]>(sql.sql_find_nearest_node, [
			`[${embedding.join(',')}]`
		])

		let fast_result: ReactResult | null = null

		if (nearest_stimulus.length > 0) {
			const stimulus = nearest_stimulus[0]

			if (
				stimulus.similarity > 0.8 &&
				(stimulus.activation >= stimulus.threshold || stimulus.potential >= stimulus.threshold)
			) {
				const habit = await this.query_raw<any[]>(sql.sql_find_strongest_habit, [stimulus.id])

				if (habit.length > 0 && habit[0].weight >= habit_threshold) {
					const h = habit[0]

					fast_result = {
						action: h.action,
						description: h.action_metadata?.desc || `Reacted to ${stimulus.label}`,
						metadata: h.action_metadata || {},
						confidence: h.weight,
						source: 'react'
					}

					await this.query_raw(sql.sql_increment_reaction_count, [stimulus.id, h.target_id])
				}
			}

			await this.stimulate(stimulus.id, 0.5)
		}

		setImmediate(() => this._deepThink(input, fast_result))

		return fast_result
	}

	async save(args: ProcessArticleArgs) {
		this.brain.reportUserActivity()
		this.brain.setBusy(true)

		try {
			const { title, content, triples, article_id, idol_id, root_ids, metrics_ids, generate_embedding } =
				args

			const res = await this.query_raw<{ id: number }>(sql.sql_process_article, [title, content])

			const aid = article_id ?? res[0].id

			if (generate_embedding ?? true) {
				await this.article.addEmbedding(aid, content)
			}

			await this.injectTriples({
				article_id: aid,
				triples,
				idol_id,
				root_ids,
				metrics_ids
			})
		} finally {
			this.brain.setBusy(false)
		}
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

	public async addNode(args: AddNodeArgs) {
		const { label, x, y, threshold, idol_id, root_ids, metrics_ids, metadata, embedding, is_action } = args

		const rows = await this.query_raw<{ id: number }>(sql.sql_add_node, [
			label,
			x,
			y,
			threshold ?? 0.5,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {}),
			embedding ? `[${embedding.join(',')}]` : null,
			is_action ?? false
		])

		return rows[0].id
	}

	public async connect(args: ConnectArgs) {
		const { source_id, target_id, weight, idol_id, root_ids, metrics_ids, metadata, is_habit } = args

		await this.query_raw(sql.sql_connect, [
			source_id,
			target_id,
			weight ?? 0.1,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {}),
			is_habit ?? false
		])
	}

	public async stimulate(node_id: number, intensity = 1.0) {
		await this.query_raw(sql.sql_stimulate, [intensity, node_id])
	}

	public async getSnapshot(weight_threshold = 0.2) {
		const nodes = await this.query_raw<Node[]>(sql.sql_get_snapshot_nodes(weight_threshold))
		const edges = await this.query_raw<Edge[]>(sql.sql_get_snapshot_edges(weight_threshold))

		return { nodes, edges }
	}

	public async getAllNodes() {
		return await this.query_raw<Node[]>(
			`SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, is_action FROM ${SCHEMA_BRAIN}.nodes`
		)
	}

	public async getNodesByIdol(idol_id: string) {
		return await this.query_raw<Node[]>(
			`SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, is_action FROM ${SCHEMA_BRAIN}.nodes WHERE idol_id = $1`,
			[idol_id]
		)
	}

	public async getNodesByRoot(root_id: string) {
		return await this.query_raw<Node[]>(
			`SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, is_action FROM ${SCHEMA_BRAIN}.nodes WHERE $1 = ANY(root_ids)`,
			[root_id]
		)
	}

	public async getEdgesByIdol(idol_id: string) {
		return await this.query_raw<Edge[]>(sql.sql_get_edges_by_idol, [idol_id])
	}

	public async getEdgesByRoot(root_id: string) {
		return await this.query_raw<Edge[]>(sql.sql_get_edges_by_root, [root_id])
	}

	public async tick(threshold_override?: number) {
		const threshold = threshold_override ?? 0.5
		await this.exec(sql.sql_tick(threshold))
	}

	public async habituate(args: HabituateArgs) {
		const { stimulus, action_label, weight = 0.9, metadata } = args

		const embedding = await this.pipeline.embed(stimulus)
		if (!embedding) return

		const stimulus_id = await this.addNode({
			label: `Stimulus: ${stimulus.slice(0, 50)}`,
			x: Math.random() * 800,
			y: Math.random() * 600,
			threshold: 0.1,
			embedding,
			metadata: { desc: stimulus }
		})

		const action_rows = await this.query_raw<{ id: number }>(
			`SELECT id FROM ${SCHEMA_BRAIN}.nodes WHERE label = $1`,
			[action_label]
		)

		let action_id: number

		if (action_rows.length > 0) {
			action_id = action_rows[0].id
		} else {
			action_id = await this.addNode({
				label: action_label,
				x: Math.random() * 800,
				y: Math.random() * 600,
				is_action: true,
				metadata: metadata ?? {}
			})
		}

		await this.connect({
			source_id: stimulus_id,
			target_id: action_id,
			weight,
			is_habit: true
		})
	}

	public async runShadowTick() {
		await this.exec(sql.sql_run_shadow_tick)
		await this.tick(0.8)
	}

	public async triggerSleepTick() {
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
		const { query, max_depth = 2, stimulate_intensity = 0.3 } = args

		const keywords = this.extractKeywords(query)

		const matched_nodes = await this.recallNodesByKeywords({ keywords })

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
		const { query, recall_depth, search_limit, rerank_limit, stimulate_on_recall } = args

		const recall_result = await this.recallFromMemory({
			query,
			max_depth: recall_depth,
			stimulate_intensity: stimulate_on_recall ? 0.3 : 0
		})

		const search_results = await this.pipeline.search({
			query,
			rerank_limit: search_limit,
			vector_search: () => this.article.searchVector({ query, limit: search_limit }),
			fulltext_search: () => this.article.searchFts({ query, limit: search_limit })
		})

		const aggregated = this.aggregateResults(recall_result, search_results)

		return await this.rerankResults(query, aggregated, rerank_limit)
	}

	private async executeCot(args: ExecuteCotArgs) {
		const {
			query,
			current_depth,
			max_depth,
			base_recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			initial_results,
			emitter,
			history_ids
		} = args

		try {
			if (!emitter.isActiveStatus() || current_depth > max_depth || !this.db) {
				emitter.finish()

				return
			}

			const depth_recall_depth = base_recall_depth + current_depth
			const top_results = initial_results.slice(0, 3)
			const insights = top_results.map(r => r.title).join(', ')
			const emerged_query = formatPerceiveQuery(query, insights)
			const emerged_node_ids = top_results.map(r => r.id)

			await this.stimulateNodes(emerged_node_ids, 0.2 * (1 + current_depth * 0.5))

			const emerged_recall_result = await this.recallFromMemory({
				query: emerged_query,
				max_depth: depth_recall_depth,
				stimulate_intensity: stimulate_on_recall ? 0.3 * (1 + current_depth) : 0
			})

			const emerged_search_results = await this.pipeline.search({
				query: emerged_query,
				rerank_limit: search_limit * 2,
				vector_search: () =>
					this.article.searchVector({ query: emerged_query, limit: search_limit * 2 }),
				fulltext_search: () => this.article.searchFts({ query: emerged_query, limit: search_limit * 2 })
			})

			const emerged_aggregated = this.aggregateResults(
				emerged_recall_result,
				emerged_search_results
			).filter(c => !history_ids.has(c.id))

			const emerged_final_results = await this.rerankResults(
				emerged_query,
				emerged_aggregated,
				rerank_limit
			)

			emerged_final_results.forEach(r => history_ids.add(r.id))

			const cot_result: COTDepthResult = {
				depth: current_depth,
				query: emerged_query,
				results: emerged_final_results,
				emerged_nodes: emerged_recall_result.nodes.map(n => n.id),
				emerged_edges: []
			}

			if (emitter.isActiveStatus()) {
				emitter.emit(cot_result)
			}

			if (current_depth < max_depth && emerged_final_results.length > 0) {
				setImmediate(() => {
					if (!this.db) {
						emitter.finish()

						return
					}

					this.executeCot({
						query: emerged_query,
						current_depth: current_depth + 1,
						max_depth,
						base_recall_depth,
						search_limit,
						rerank_limit,
						stimulate_on_recall,
						initial_results: emerged_final_results,
						emitter,
						history_ids
					})
				})
			} else {
				emitter.finish()
			}
		} catch (e: any) {
			emitter.finish()

			if (
				e.message?.includes('DB not initialized') ||
				e.message?.includes('closed') ||
				e.message?.includes('signature mismatch')
			) {
				return
			}

			console.error('CoT Execution Error:', e)
		}
	}

	private async recallNodesByKeywords(args: RecallNodesByKeywordsArgs) {
		const { keywords, limit = 10 } = args

		if (keywords.length === 0) return []

		const results: Node[] = []

		for (const keyword of keywords) {
			const nodes = await this.query_raw<Node[]>(sql_brain.sql_recall_nodes_by_label, [
				`%${keyword}%`,
				limit
			])
			results.push(...nodes)
		}

		return Array.from(new Map(results.map(n => [n.id, n])).values())
	}

	private async recallRelatedNodes(node_ids: number[], max_depth: number) {
		if (node_ids.length === 0 || max_depth <= 0) return []

		return await this.query_raw<Node[]>(sql_brain.sql_recall_related_nodes, [node_ids, max_depth, 20])
	}

	private async getNodeContexts(node_ids: number[]): Promise<ContextResult[]> {
		if (node_ids.length === 0) return []

		const articles = await this.query_raw<any[]>(sql_brain.sql_get_node_articles, [node_ids])

		return articles.map(article => ({
			article_ids: [article.id],
			relevance_score: 1.0
		}))
	}

	private async stimulateNodes(node_ids: number[], intensity: number) {
		if (node_ids.length === 0 || intensity <= 0) return

		for (const id of node_ids) {
			await this.query_raw(sql.sql_stimulate, [intensity, id])
		}
	}

	private async _deepThink(input: string, fast_result: ReactResult | null) {
		if (!this.db) return

		try {
			const { result } = await this.query({
				query: input,
				cot_depth: 1,
				search_limit: 5,
				rerank_limit: 3
			})

			if (!this.db) return

			if (result.length > 0 && this._onAction) {
				const top = result[0]

				const slow_result: ReactResult = {
					action: top.title,
					description: top.content.split('\n')[0] || 'Slow system decision',
					metadata: top.metadata || {},
					confidence: top.combinedScore,
					source: 'act'
				}

				if (!fast_result || slow_result.confidence > fast_result.confidence + 0.2) {
					this._onAction(slow_result)
				}
			}
		} catch (e) {
			console.error('Deep think error:', e)
		}
	}

	private async strengthenRelatedEdges(args: StrengthenRelatedEdgesArgs) {
		const { matched_nodes, related_nodes } = args

		const node_ids = [...matched_nodes, ...related_nodes].map(n => n.id)

		if (node_ids.length < 2) return

		await this.query_raw(sql.sql_strengthen_edges_batch, [0.1, node_ids, node_ids])
	}

	private aggregateResults(recall_result: MemoryRecallResult, search_results: SearchResult[]) {
		const candidates: AggregatedCandidate[] = []
		const stimulated_node_ids = new Set(recall_result.stimulated_nodes)
		const node_potential_map = new Map<number, number>()

		for (const node of recall_result.nodes) {
			node_potential_map.set(node.id, node.potential)
		}

		for (const context of recall_result.related_contexts) {
			for (const article_id of context.article_ids) {
				const article = search_results.find(r => r.id === article_id)

				if (article) {
					const memory_strength = this.calculateMemoryStrength(context)

					candidates.push({
						id: article.id,
						title: article.title,
						content: article.content,
						rerankScore: article.rerankScore,
						relevance_score: 1.5,
						memory_strength,
						source: 'memory',
						stimulated: true,
						metadata: (article as any).metadata
					})
				}
			}
		}

		for (const result of search_results) {
			if (!candidates.find(c => c.id === result.id)) {
				const is_stimulated = stimulated_node_ids.has(result.id)
				const memory_strength = node_potential_map.get(result.id) ?? 0

				candidates.push({
					id: result.id,
					title: result.title,
					content: result.content,
					rerankScore: result.rerankScore,
					relevance_score: result.rerankScore,
					memory_strength,
					source: is_stimulated ? 'memory' : 'external',
					stimulated: is_stimulated,
					metadata: (result as any).metadata
				})
			}
		}

		const high_potential_nodes = recall_result.nodes
			.filter(n => n.potential > 0.5 && !candidates.find(c => c.id === n.id))
			.slice(0, 5)

		for (const node of high_potential_nodes) {
			candidates.push({
				id: node.id,
				title: node.label,
				content: formatNodeContent(node.label, node.metadata?.desc),
				rerankScore: node.potential,
				relevance_score: node.potential * 0.8,
				memory_strength: node.potential,
				source: 'implicit',
				stimulated: true,
				metadata: node.metadata
			})
		}

		return candidates
	}

	private calculateMemoryStrength(context: { relevance_score?: number }) {
		return (context.relevance_score ?? 1.0) * 0.5 + 0.5
	}

	private async rerankResults(query: string, candidates: AggregatedCandidate[], limit: number) {
		if (candidates.length === 0) return []

		const documents = candidates.map(c => {
			const source_info = formatSourceInfo(c.source, c.stimulated, c.memory_strength)
			return `${c.title}\n${source_info}\n${c.content}`
		})

		const rerank_scores = await this.pipeline.rerank(query, documents)

		const results: HybridSearchResult[] = candidates.map((candidate, index) => ({
			id: candidate.id,
			title: candidate.title,
			content: candidate.content,
			source: candidate.source,
			rerankScore: rerank_scores[index]?.score ?? 0,
			relevanceScore: candidate.relevance_score,
			combinedScore: (rerank_scores[index]?.score ?? 0) * 0.6 + candidate.relevance_score * 0.4,
			stimulated: candidate.stimulated,
			memoryStrength: candidate.memory_strength,
			metadata: candidate.metadata
		}))

		const sorted_results = results.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit)

		await this.stimulateByRanking(sorted_results)

		return sorted_results
	}

	private async stimulateByRanking(results: HybridSearchResult[]) {
		if (results.length === 0) return

		const max_stimulation = 0.5
		const min_stimulation = 0.05
		const decay_rate = (max_stimulation - min_stimulation) / Math.max(results.length - 1, 1)
		const stimulation_map = new Map<number, number>()

		for (let i = 0; i < results.length; i++) {
			const intensity = Math.max(max_stimulation - i * decay_rate, min_stimulation)
			stimulation_map.set(results[i].id, intensity)
		}

		const node_ids = Array.from(stimulation_map.keys())
		const intensities = node_ids.map(id => stimulation_map.get(id)!)

		for (let i = 0; i < node_ids.length; i++) {
			await this.query_raw(sql_brain.sql_stimulate_nodes_batch, [intensities[i], [node_ids[i]]])
		}
	}

	private async injectTriples(args: InjectTriplesArgs) {
		const { article_id, triples, idol_id, root_ids, metrics_ids } = args
		await this.exec(sql.sql_inject_triples_begin)

		for (const t of triples) {
			const sub_id = await this.upsertNode({
				label: t.subject,
				article_id,
				idol_id,
				root_ids,
				metrics_ids,
				metadata: t.metadata
			})

			const obj_id = await this.upsertNode({
				label: t.object,
				article_id,
				idol_id,
				root_ids,
				metrics_ids,
				metadata: t.metadata
			})

			const weight = calculateWeight(t.learning_rate)

			await this.exec(
				sql.sql_inject_triples_insert_edge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					t.predicate,
					weight,
					idol_id,
					root_ids,
					metrics_ids,
					t.metadata
				)
			)

			await this.exec(
				sql.sql_inject_triples_update_edge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					weight,
					idol_id,
					root_ids,
					metrics_ids,
					t.metadata
				)
			)
		}

		await this.exec(sql.sql_inject_triples_commit)
	}

	private async upsertNode(args: UpsertNodeArgs) {
		const { label, article_id, idol_id, root_ids, metrics_ids, metadata, embedding, is_action } = args

		await this.query_raw(sql.sql_upsert_node, [
			label,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {}),
			embedding ? `[${embedding.join(',')}]` : null,
			is_action ?? false
		])

		const res = await this.query_raw<{ id: number }>(sql.sql_upsert_node_select, [label])
		const node_id = res[0].id

		await this.query_raw(sql.sql_node_sources, [node_id, article_id])

		return node_id
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

	private async query_raw<T = any>(sql_str: string, params?: any[]) {
		if (!this.db) {
			throw new Error('DB not initialized')
		}

		const res = params ? await this.db.query(sql_str, params) : await this.db.query(sql_str)
		return JSON.parse(JSON.stringify(res.rows)) as T
	}

	private extractKeywords(query: string) {
		return query
			.toLowerCase()
			.split(/\s+/)
			.filter(w => w.length > 2)
	}
}

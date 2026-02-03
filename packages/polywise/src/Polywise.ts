import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'

import Article from './Article'
import Brain from './Brain'
import Pipeline from './Pipeline'
import * as sql from './sql'
import * as sql_brain from './sql/Brain'
import * as sql_meta from './sql/meta'
import { calculateWeight, ChainEmitter, CURRENT_SCHEMA_VERSION, migrate, validateMigrations } from './utils'

import type {
	AddNodeArgs,
	AggregatedCandidate,
	ChainOfThought,
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
	UpsertNodeArgs
} from './types'

export default class Polywise {
	private db: PGlite | null = null

	public article: Article

	public brain: Brain

	public pipeline: Pipeline

	constructor() {
		this.pipeline = new Pipeline()
		this.article = new Article(this.pipeline)
		this.brain = new Brain()
	}

	async init(args: PolywiseArgs = {}) {
		const { data_dir, cache_dir, onTick, embedding_config, reranker_config } = args

		this.db = new PGlite(data_dir || ':polywise:', {
			relaxedDurability: true,
			extensions: { vector }
		})

		await this.pipeline?.init({
			cache_dir,
			embedding_config,
			reranker_config
		})

		this.article?.init({
			db: this.db
		})

		this.brain?.init({
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

			const version_result = await this.query<{ version: number }>(sql_meta.sql_get_current_version)

			const current_version = version_result[0]?.version ?? 0

			if (current_version < CURRENT_SCHEMA_VERSION) {
				await migrate(current_version, this.exec.bind(this), this.query.bind(this))
			}

			const check_result = await this.query<{ count: string }>(
				"SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'knowledge' AND table_name = 'articles'"
			)

			if (parseInt(check_result[0]?.count || '0') === 0) {
				await this.exec([
					sql.sql_create_extension_vector,
					sql.sql_create_schema_knowledge,
					sql.sql_create_table_articles
				])
			}
		} catch (e) {
			console.error('Migration error:', e)
		}
	}

	async addNode(args: AddNodeArgs) {
		const { label, x, y, threshold, idol_id, root_ids, metrics_ids, metadata } = args

		const rows = await this.query<{ id: number }>(sql.sql_add_node, [
			label,
			x,
			y,
			threshold ?? 0.5,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])

		return rows[0].id
	}

	async connect(args: ConnectArgs) {
		const { source_id, target_id, weight, idol_id, root_ids, metrics_ids, metadata } = args

		await this.query(sql.sql_connect, [
			source_id,
			target_id,
			weight ?? 0.1,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])
	}

	async stimulate(node_id: number, intensity = 1.0) {
		await this.query(sql.sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = 0.2) {
		const nodes = await this.query<Node[]>(sql.sql_get_snapshot_nodes(weight_threshold))

		const edges = await this.query<Edge[]>(sql.sql_get_snapshot_edges(weight_threshold))

		return { nodes, edges }
	}

	async getAllNodes() {
		return await this.query<Node[]>(
			'SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata FROM brain.nodes'
		)
	}

	async getNodesByIdol(idol_id: string) {
		return await this.query<Node[]>(sql.sql_get_nodes_by_idol, [idol_id])
	}

	async getNodesByRoot(root_id: string) {
		return await this.query<Node[]>(sql.sql_get_nodes_by_root, [root_id])
	}

	async getEdgesByIdol(idol_id: string) {
		return await this.query<Edge[]>(sql.sql_get_edges_by_idol, [idol_id])
	}

	async getEdgesByRoot(root_id: string) {
		return await this.query<Edge[]>(sql.sql_get_edges_by_root, [root_id])
	}

	async tick(threshold_override?: number) {
		const threshold = threshold_override ?? 0.5

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

	async search(args: QueryArgs): Promise<{ result: HybridSearchResult[]; cot: ChainOfThought }> {
		const {
			query,
			recall_depth = 2,
			search_limit = 20,
			rerank_limit = 10,
			stimulate_on_recall = true,
			cot_depth = 0
		} = args

		const emitter = new ChainEmitter()

		const initialResult = await this.executeSingleSearch({
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall
		})

		if (cot_depth <= 0) {
			return { result: initialResult, cot: emitter }
		}

		this.executeChainOfThought({
			query,
			initialResults: initialResult,
			emitter,
			maxDepth: cot_depth,
			baseRecallDepth: recall_depth,
			searchLimit: search_limit,
			rerankLimit: rerank_limit,
			stimulateOnRecall: stimulate_on_recall,
			currentDepth: 1,
			historyIds: new Set<number>(initialResult.map(r => r.id))
		})

		return { result: initialResult, cot: emitter }
	}

	private async executeSingleSearch(args: {
		query: string
		recall_depth: number
		search_limit: number
		rerank_limit: number
		stimulate_on_recall: boolean
	}): Promise<HybridSearchResult[]> {
		const { query, recall_depth, search_limit, rerank_limit, stimulate_on_recall } = args

		const recallResult = await this.recallFromMemory({
			query,
			max_depth: recall_depth,
			stimulate_intensity: stimulate_on_recall ? 0.3 : 0
		})

		const searchResults = await this.pipeline.search({
			query,
			vectorSearch: () => this.article.searchVector({ query, limit: search_limit }),
			fulltextSearch: () => this.article.searchFts({ query, limit: search_limit }),
			rerankLimit: search_limit
		})

		const aggregated = this.aggregateResults(recallResult, searchResults)

		const finalResults = await this.rerankResults(query, aggregated, rerank_limit)

		return finalResults
	}

	private async executeChainOfThought(args: {
		query: string
		initialResults: HybridSearchResult[]
		emitter: ChainEmitter
		maxDepth: number
		baseRecallDepth: number
		searchLimit: number
		rerankLimit: number
		stimulateOnRecall: boolean
		currentDepth: number
		historyIds: Set<number>
	}): Promise<void> {
		const {
			query,
			initialResults,
			emitter,
			maxDepth,
			baseRecallDepth,
			searchLimit,
			rerankLimit,
			stimulateOnRecall,
			currentDepth,
			historyIds
		} = args

		if (!emitter.isActiveStatus() || currentDepth > maxDepth || !this.db) {
			return
		}

		const depthRecallDepth = baseRecallDepth + currentDepth

		// 提取这一层的核心洞察：结合 Top 3 结果的标题
		const topResults = initialResults.slice(0, 3)
		const insights = topResults.map(r => r.title).join(', ')

		// 构造更具启发性的 emergedQuery
		// 不再是简单的字符串叠加，而是将之前的 query 作为背景，将当前的 insights 作为新的搜索方向
		const emergedQuery = `${query} [洞察: ${insights}]`

		const emergedNodeIds = topResults.map(r => r.id)
		// 刺激力度随深度增加，模拟思维的深入
		await this.stimulateNodes(emergedNodeIds, 0.2 * (1 + currentDepth * 0.5))

		// 执行下一层搜索
		const emergedRecallResult = await this.recallFromMemory({
			query: emergedQuery,
			max_depth: depthRecallDepth,
			stimulate_intensity: stimulateOnRecall ? 0.3 * (1 + currentDepth) : 0
		})

		const emergedSearchResults = await this.pipeline.search({
			query: emergedQuery,
			vectorSearch: () => this.article.searchVector({ query: emergedQuery, limit: searchLimit * 2 }),
			fulltextSearch: () => this.article.searchFts({ query: emergedQuery, limit: searchLimit * 2 }),
			rerankLimit: searchLimit * 2
		})

		let emergedAggregated = this.aggregateResults(emergedRecallResult, emergedSearchResults)

		// 过滤掉已经在历史中出现过的结果
		emergedAggregated = emergedAggregated.filter(c => !historyIds.has(c.id))

		const emergedFinalResults = await this.rerankResults(emergedQuery, emergedAggregated, rerankLimit)

		// 记录新发现的结果
		emergedFinalResults.forEach(r => historyIds.add(r.id))

		const cotResult: COTDepthResult = {
			depth: currentDepth,
			query: emergedQuery,
			results: emergedFinalResults,
			emerged_nodes: emergedRecallResult.nodes.map(n => n.id),
			emerged_edges: []
		}

		emitter.emit(cotResult)

		if (currentDepth < maxDepth && emergedFinalResults.length > 0) {
			setImmediate(() => {
				if (!this.db) return

				this.executeChainOfThought({
					query: emergedQuery,
					initialResults: emergedFinalResults,
					emitter,
					maxDepth,
					baseRecallDepth,
					searchLimit,
					rerankLimit,
					stimulateOnRecall,
					currentDepth: currentDepth + 1,
					historyIds
				})
			})
		}
	}

	async recallFromMemory(args: RecallArgs): Promise<MemoryRecallResult> {
		const { query, max_depth = 2, stimulate_intensity = 0.3 } = args

		const keywords = this.extractKeywords(query)
		const matchedNodes = await this.recallNodesByKeywords(keywords)

		const relatedNodes = await this.recallRelatedNodes(
			matchedNodes.map(n => n.id),
			max_depth
		)

		if (stimulate_intensity > 0) {
			const allNodes = [...matchedNodes, ...relatedNodes]
			const nodeIds = allNodes.map(n => n.id)
			await this.stimulateNodes(nodeIds, stimulate_intensity)
			await this.strengthenRelatedEdges(matchedNodes, relatedNodes)
		}

		const contexts = await this.getNodeContexts([...matchedNodes, ...relatedNodes].map(n => n.id))

		return {
			nodes: [...matchedNodes, ...relatedNodes],
			edges: [],
			stimulated_nodes: [...matchedNodes, ...relatedNodes].map(n => n.id),
			related_contexts: contexts
		}
	}

	private extractKeywords(query: string): string[] {
		return query
			.toLowerCase()
			.split(/\s+/)
			.filter(w => w.length > 2)
	}

	private async recallNodesByKeywords(keywords: string[]): Promise<Node[]> {
		if (!this.db || keywords.length === 0) return []

		const results: Node[] = []
		for (const keyword of keywords) {
			const nodes = await this.query<Node[]>(sql_brain.sql_recall_nodes_by_label, [`%${keyword}%`, 10])
			results.push(...nodes)
		}

		const uniqueNodes = Array.from(new Map(results.map(n => [n.id, n])).values())

		return uniqueNodes
	}

	private async recallRelatedNodes(nodeIds: number[], maxDepth: number): Promise<Node[]> {
		if (!this.db || nodeIds.length === 0 || maxDepth <= 0) return []

		const res = await this.query<Node[]>(sql_brain.sql_recall_related_nodes, [nodeIds, maxDepth, 20])

		return res
	}

	private async getNodeContexts(nodeIds: number[]): Promise<any[]> {
		if (!this.db || nodeIds.length === 0) return []

		const res = await this.query<any[]>(sql_brain.sql_get_node_articles, [nodeIds])

		return res
	}

	private async stimulateNodes(nodeIds: number[], intensity: number) {
		if (!this.db || nodeIds.length === 0 || intensity <= 0) return

		for (const id of nodeIds) {
			await this.query(sql.sql_stimulate, [intensity, id])
		}
	}

	private async strengthenRelatedEdges(matchedNodes: Node[], relatedNodes: Node[]) {
		if (!this.db) return

		const allNodeIds = [...matchedNodes, ...relatedNodes].map(n => n.id)

		if (allNodeIds.length < 2) return

		await this.query(sql.sql_strengthen_edges_batch, [0.1, allNodeIds, allNodeIds])
	}

	private aggregateResults(recallResult: MemoryRecallResult, searchResults: SearchResult[]): AggregatedCandidate[] {
		const candidates: AggregatedCandidate[] = []

		const stimulatedNodeIds = new Set(recallResult.stimulated_nodes)

		const nodePotentialMap = new Map<number, number>()
		for (const node of recallResult.nodes) {
			nodePotentialMap.set(node.id, node.potential)
		}

		for (const context of recallResult.related_contexts) {
			const articleId = context.id
			const article = searchResults.find(r => r.id === articleId)
			if (article) {
				const memoryStrength = this.calculateMemoryStrength(context, recallResult.nodes)
				candidates.push({
					id: article.id,
					title: article.title,
					content: article.content,
					source: 'memory',
					rerankScore: article.rerankScore,
					relevance_score: 1.0 * 1.5,
					stimulated: true,
					memory_strength: memoryStrength
				})
			}
		}

		for (const result of searchResults) {
			if (!candidates.find(c => c.id === result.id)) {
				const isStimulated = stimulatedNodeIds.has(result.id)
				const memoryStrength = nodePotentialMap.get(result.id) ?? 0

				candidates.push({
					id: result.id,
					title: result.title,
					content: result.content,
					source: isStimulated ? 'memory' : 'external',
					rerankScore: result.rerankScore,
					relevance_score: result.rerankScore,
					stimulated: isStimulated,
					memory_strength: memoryStrength
				})
			}
		}

		const highPotentialNodes = recallResult.nodes
			.filter(n => n.potential > 0.5 && !candidates.find(c => c.id === n.id))
			.slice(0, 5)

		for (const node of highPotentialNodes) {
			candidates.push({
				id: node.id,
				title: node.label,
				content: node.metadata?.desc || `概念: ${node.label}`,
				source: 'implicit',
				rerankScore: node.potential,
				relevance_score: node.potential * 0.8,
				stimulated: true,
				memory_strength: node.potential
			})
		}

		return candidates
	}

	private calculateMemoryStrength(
		context: { idol_id?: string; root_ids?: string[]; relevance_score?: number; id: number },
		nodes: Node[]
	): number {
		return (context.relevance_score ?? 1.0) * 0.5 + 0.5
	}

	private async rerankResults(
		query: string,
		candidates: AggregatedCandidate[],
		limit: number
	): Promise<HybridSearchResult[]> {
		if (candidates.length === 0) return []

		const documents = candidates.map(c => {
			const sourceInfo = `[来源:${c.source}${c.stimulated ? ',已激活' : ''},记忆强度:${c.memory_strength.toFixed(2)}]`
			return `${c.title}\n${sourceInfo}\n${c.content}`
		})

		const rerankScores = await this.pipeline.rerank(query, documents)

		const results: HybridSearchResult[] = candidates.map((candidate, index) => ({
			id: candidate.id,
			title: candidate.title,
			content: candidate.content,
			source: candidate.source,
			rerankScore: rerankScores[index]?.score ?? 0,
			relevanceScore: candidate.relevance_score,
			combinedScore: (rerankScores[index]?.score ?? 0) * 0.6 + candidate.relevance_score * 0.4,
			stimulated: candidate.stimulated,
			memoryStrength: candidate.memory_strength
		}))

		const sortedResults = results.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit)

		await this.stimulateByRanking(sortedResults)

		return sortedResults
	}

	private async stimulateByRanking(results: HybridSearchResult[]): Promise<void> {
		if (results.length === 0) return

		const maxStimulation = 0.5
		const minStimulation = 0.05
		const decayRate = (maxStimulation - minStimulation) / Math.max(results.length - 1, 1)

		const stimulationMap = new Map<number, number>()

		for (let i = 0; i < results.length; i++) {
			const intensity = Math.max(maxStimulation - i * decayRate, minStimulation)
			stimulationMap.set(results[i].id, intensity)
		}

		const nodeIds = Array.from(stimulationMap.keys())
		const intensities = nodeIds.map(id => stimulationMap.get(id)!)

		for (let i = 0; i < nodeIds.length; i++) {
			await this.query(sql_brain.sql_stimulate_nodes_batch, [intensities[i], [nodeIds[i]]])
		}
	}

	async processArticle(args: ProcessArticleArgs) {
		const { title, content, triples, idol_id, root_ids, metrics_ids, generate_embedding } = args

		const res = await this.query<{ id: number }>(sql.sql_process_article, [title, content])

		const article_id = res[0].id

		if (generate_embedding ?? true) {
			await this.article.addEmbedding(article_id, content)
		}

		await this._injectTriples({
			triples,
			article_id,
			idol_id,
			root_ids,
			metrics_ids
		})
	}

	private async _injectTriples(args: InjectTriplesArgs) {
		const { triples, article_id, idol_id, root_ids, metrics_ids } = args

		await this.exec(sql.sql_inject_triples_begin)

		for (const t of triples) {
			const sub_id = await this._upsertNode({
				label: t.subject,
				article_id,
				idol_id,
				root_ids,
				metrics_ids,
				metadata: t.metadata
			})

			const obj_id = await this._upsertNode({
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

	private async _upsertNode(args: UpsertNodeArgs) {
		const { label, article_id, idol_id, root_ids, metrics_ids, metadata } = args

		await this.query(sql.sql_upsert_node, [
			label,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])

		const res = await this.query<{ id: number }>(sql.sql_upsert_node_select, [label])

		const nid = res[0].id

		await this.query(sql.sql_node_sources, [nid, article_id])

		return nid
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

	private async query<T = any>(sql_str: string, params?: any[]) {
		if (!this.db) {
			throw new Error('DB not initialized')
		}

		const res = params ? await this.db.query(sql_str, params) : await this.db.query(sql_str)

		return JSON.parse(JSON.stringify(res.rows)) as T
	}

	async getDataDir() {
		const dataDir = process.env.POLYWISE_DATA_DIR || ':polywise:'
		return dataDir
	}

	async getStats() {
		const [nodeResult, edgeResult, articleResult] = await Promise.all([
			this.query<{ count: string }>('SELECT COUNT(*) as count FROM brain.nodes'),
			this.query<{ count: string }>('SELECT COUNT(*) as count FROM brain.edges'),
			this.query<{ count: string }>('SELECT COUNT(*) as count FROM knowledge.articles')
		])

		const memoryUsage = process.memoryUsage()

		return {
			node_count: parseInt(nodeResult[0]?.count || '0', 10),
			edge_count: parseInt(edgeResult[0]?.count || '0', 10),
			article_count: parseInt(articleResult[0]?.count || '0', 10),
			memory_usage: memoryUsage.heapUsed
		}
	}

	async reset() {
		await this.off()

		const dataDir = await this.getDataDir()
		if (dataDir !== ':memory:' && dataDir !== ':polywise:') {
			const fs = await import('fs-extra')
			await fs.remove(dataDir)
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
}

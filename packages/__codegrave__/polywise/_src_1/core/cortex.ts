import { injectable } from 'tsyringe'

import { system } from '@/consts'
import {
	aggregation,
	ChainEmitter,
	getEdgesBetweenNodes,
	getNodesByKeywords,
	getNodesContexts,
	getRelatedNodes,
	getUniqueDocs,
	getWinNodes
} from '@/utils'

import type { Memory, QueryArgs, QueryResult, RecallArgs, SearchResult } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async process(args: QueryArgs) {
		const { cot_depth = 1, process } = args

		const emitter = new ChainEmitter()

		if (process) {
			emitter.on((_, steps) => {
				process.emit('cot', steps)
			})
		}

		let res: QueryResult

		if (cot_depth <= 1) {
			res = await this.search(args, emitter)
		} else {
			res = await this.deepSearch(args, emitter)
		}

		emitter.finish(res)

		process?.off()
		emitter?.off()

		return res
	}

	async search(args: QueryArgs, emitter: ChainEmitter) {
		const { query, cot_depth, process } = args

		this.p.logger.log('SEARCH', query)

		const query_embedding = await this.p.pipeline.embed(query)
		const sequence_context_id = await this.p.context.getSequentialContext()
		const resolved_context_id = await this.p.context.resolveContextIdForQuery(query_embedding)

		if (resolved_context_id) {
			this.p.context.last_context_id = resolved_context_id
		}

		this.p.logger.log('SEARCH', 'recall start')

		const recall_res = await this.recall({ query, context_id: resolved_context_id ?? undefined })

		this.p.logger.log('SEARCH', 'article.searchByVector start')

		const vector_res = await this.p.article.searchByVector({
			query
		})

		process?.emit('vector_search_results', vector_res)

		this.p.logger.log('SEARCH', 'article.searchByText start')

		const fulltext_res = await this.p.article.searchByText({
			query
		})

		process?.emit('fulltext_search_results', fulltext_res)

		const recalled_article_ids = new Set<string>()

		for (const context of recall_res.related_contexts) {
			for (const id of context.article_ids) {
				recalled_article_ids.add(id)
			}
		}

		const found_ids = new Set([...vector_res.map(r => r.id), ...fulltext_res.map(r => r.id)])
		const missing_ids = Array.from(recalled_article_ids).filter(id => !found_ids.has(id))

		if (missing_ids.length > 0) {
			this.p.logger.log('SEARCH', 'fetching missing memory articles', () => ({ count: missing_ids.length }))

			const missing_articles = await this.p.article.getMany(missing_ids)

			const missing_results = Object.values(missing_articles).map(a => ({
				id: a.id,
				content: a.content,
				similarity: 0.5,
				metadata: a.metadata,
				created_at: a.created_at,
				updated_at: a.updated_at
			}))

			vector_res.push(...missing_results)
		}

		const { candidates, documents } = getUniqueDocs({ vector_res, fulltext_res })
		const rerank_scores = await this.p.pipeline.rerank(query, documents)

		const results: Array<SearchResult> = candidates.map((item, index) => ({
			id: item.id,
			content: item.content,
			source: item.source,
			score: rerank_scores[index]?.score ?? 0,
			metadata: item.metadata,
			updated_at: item.updated_at,
			context_id: item.context_id
		}))

		const target_results = results.sort((a, b) => b.score - a.score).slice(0, 20)

		this.p.logger.log('SEARCH', 'aggregateResults start')

		const { memory } = await aggregation({
			recall_res,
			target_results,
			sequence_context_id
		})

		process?.emit('aggregated_results', { memory })

		this.p.logger.log('SEARCH', 'rerankMemory start')

		return {
			memory: reranked_memory
		}
	}

	private async deepSearch(args: QueryArgs, emitter: ChainEmitter) {
		const { query: original_query, cot_depth = 2, process } = args

		return {
			memory: final_memory,
			cot: emitter
		}
	}

	async recall(args: RecallArgs) {
		const {
			query,
			max_depth = system.default_recall_depth,
			stimulate_intensity = system.memory_recall_intensity,
			is_learning = false,
			arousal = 1.0,
			context_id
		} = args

		const query_keywords = await this.p.pipeline.getKeywords(query)
		const recall_keywords = query_keywords.slice(0, system.query_keywords_limit)

		const matched_nodes = await getNodesByKeywords(this.p.db, recall_keywords)

		const related_nodes = await getRelatedNodes(
			this.p.db,
			matched_nodes.map(n => n.id),
			max_depth,
			context_id
		)

		const all_nodes = [...matched_nodes]
		const matched_ids = new Set(matched_nodes.map(n => n.id))

		for (const node of related_nodes) {
			if (!matched_ids.has(node.id)) {
				all_nodes.push(node)
				matched_ids.add(node.id)
			}
		}

		const all_edges = await getEdgesBetweenNodes(
			this.p.db,
			all_nodes.map(n => n.id)
		)

		const { selected_nodes, filtered_related_nodes } = getWinNodes({
			matched_nodes,
			related_nodes,
			edges: all_edges
		})

		const selected_ids = new Set(selected_nodes.map(node => node.id))

		const selected_edges = all_edges.filter(
			edge => selected_ids.has(edge.source_id!) && selected_ids.has(edge.target_id!)
		)

		if (stimulate_intensity > 0) {
			const node_ids = selected_nodes.map(node => node.id)

			await this.p.brain.stimulate(node_ids, stimulate_intensity)

			if (is_learning) {
				await this.p.brain.strengthen({ matched_nodes, related_nodes: filtered_related_nodes })
			}

			await this.p.brain.spread({ steps: 3, is_learning, arousal })
		}

		const contexts = await getNodesContexts(
			this.p.db,
			selected_nodes.map(node => node.id)
		)

		return {
			nodes: selected_nodes,
			edges: selected_edges,
			stimulated_nodes: selected_nodes.map(node => node.id),
			related_contexts: contexts
		}
	}

	private filterNewMemory(new_memory: Array<Memory>, collected: Map<string, Memory>) {
		return new_memory.filter(k => {
			if (collected.has(k.id)) return false

			if (k.score < system.default_similarity_threshold * 0.8) return false

			return true
		})
	}

	private filterByQuality(memory: Array<Memory>, threshold: number) {
		return memory.filter(k => k.score >= threshold)
	}

	private async generateNextQuery(original_query: string, new_memory: Array<Memory>, used_queries: Set<string>) {
		const content_text = new_memory.map(k => k.content).join(' ')
		const keywords = await this.p.pipeline.getKeywords(content_text)

		if (keywords.length === 0) return null

		const top_keywords = keywords.slice(0, 3)
		const candidate_query = `${original_query} ${top_keywords.join(' ')}`

		if (used_queries.has(candidate_query)) {
			const alt_keywords = keywords.slice(0, 5)
			const alt_query = `${original_query} ${alt_keywords.join(' ')}`

			if (used_queries.has(alt_query)) {
				return null
			}

			return alt_query
		}

		return candidate_query
	}
}

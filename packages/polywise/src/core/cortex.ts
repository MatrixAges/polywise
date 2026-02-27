import { injectable } from 'tsyringe'

import { system } from '@/consts'
import {
	ChainEmitter,
	getEdgesBetweenNodes,
	getNodesByKeywords,
	getNodesContexts,
	getRelatedNodes,
	getWinNodes
} from '@/utils'

import type { Memory, QueryArgs, QueryResult, RecallArgs } from '../types'
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
	}

	private async deepSearch(args: QueryArgs, emitter: ChainEmitter) {
		const { cot_depth = 2, process } = args

		const collected_memory = new Map<string, Memory>()
		const used_queries = new Set<string>()

		let current_query = original_query
		used_queries.add(current_query)

		for (let depth = 0; depth < cot_depth; depth++) {
			process?.emit('cot_iteration', { depth: depth + 1, query: current_query })

			const search_results = await this.execute_single_search({
				query: current_query,
				recall_depth: args.recall_depth,
				search_limit: args.search_limit,
				rerank_limit: args.rerank_limit,
				stimulate_on_recall: args.stimulate_on_recall,
				idol_id: args.idol_id,
				root_ids: args.root_ids,
				context_id: args.context_id,
				process: args.process
			})

			const new_memory = this.filterNewMemory(search_results.memory, collected_memory)

			if (new_memory.length === 0) {
				process?.emit('cot_converged', { depth: depth + 1, reason: 'no_new_results' })
				break
			}

			for (const k of new_memory) {
				collected_memory.set(k.id, k)
			}

			process?.emit('cot_iteration_results', {
				depth: depth + 1,
				new_results: new_memory.length,
				total_results: collected_memory.size
			})

			if (depth < cot_depth - 1) {
				const next_query = this.generateNextQuery(original_query, new_memory, used_queries)

				if (!next_query || used_queries.has(next_query)) {
					process?.emit('cot_converged', { depth: depth + 1, reason: 'no_new_query' })
					break
				}

				current_query = next_query
				used_queries.add(current_query)
			}
		}

		const all_memory = Array.from(collected_memory.values())

		const filtered_memory = this.filterByQuality(all_memory, DEFAULT_SIMILARITY_THRESHOLD)

		const { memory: final_memory } = await processResults(original_query, filtered_memory, this.pipeline)

		emitter.finish({ memory: final_memory })

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
			query_embedding,
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

	private generateNextQuery(original_query: string, new_memory: Array<Memory>, used_queries: Set<string>) {
		const content_text = new_memory.map(k => k.content).join(' ')
		const keywords = extractKeywords(content_text)

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

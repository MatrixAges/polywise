import { injectable } from 'tsyringe'

import { DEFAULT_SIMILARITY_THRESHOLD } from './consts'
import Polywise from './Polywise'
import { ChainEmitter, extractKeywords, processResults } from './utils'

import type { CortexProcessArgs } from './types/cortex'
import type { Memory } from './types/polywise'

@injectable()
export default class Cortex {
	private p: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async process(args: CortexProcessArgs) {
		const { query, cot_depth = 0, process } = args

		const emitter = new ChainEmitter()

		if (process) {
			emitter.on((_data, steps) => {
				process.emit('cot', steps)
			})
		}

		// Single search mode (cot_depth <= 1)
		if (cot_depth <= 1) {
			return await this.executeSingleSearch(query, args, emitter)
		}

		// Iterative search mode (cot_depth > 1)
		return await this.executeIterativeSearch(query, args, emitter)
	}

	private async executeSingleSearch(query: string, args: CortexProcessArgs, emitter: ChainEmitter) {
		const { memory } = await this.p.executeSingleSearch({
			query,
			recall_depth: args.recall_depth,
			search_limit: args.search_limit,
			rerank_limit: args.rerank_limit,
			stimulate_on_recall: args.stimulate_on_recall,
			idol_id: args.idol_id,
			root_ids: args.root_ids,
			metrics_ids: args.metrics_ids,
			process: args.process
		})

		const { memory: k_strings, metadata } = await processResults(query, memory, this.p.pipeline)

		return {
			memory: k_strings,
			metadata,
			cot: (emitter.finish({ memory: k_strings, metadata }) as any) || emitter
		}
	}

	private async executeIterativeSearch(original_query: string, args: CortexProcessArgs, emitter: ChainEmitter) {
		const { cot_depth = 2, process } = args

		const collected_memory = new Map<number, Memory>()
		const used_queries = new Set<string>()

		let current_query = original_query
		used_queries.add(current_query)

		for (let depth = 0; depth < cot_depth; depth++) {
			process?.emit('cot_iteration', { depth: depth + 1, query: current_query })

			const search_results = await this.p.executeSingleSearch({
				query: current_query,
				recall_depth: args.recall_depth,
				search_limit: args.search_limit,
				rerank_limit: args.rerank_limit,
				stimulate_on_recall: args.stimulate_on_recall,
				idol_id: args.idol_id,
				root_ids: args.root_ids,
				metrics_ids: args.metrics_ids,
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

		const { memory: k_strings, metadata } = await processResults(
			original_query,
			filtered_memory,
			this.p.pipeline
		)

		return {
			memory: k_strings,
			metadata,
			cot: (emitter.finish({ memory: k_strings, metadata }) as any) || emitter
		}
	}

	private filterNewMemory(new_memory: Array<Memory>, collected: Map<number, Memory>): Array<Memory> {
		return new_memory.filter(k => {
			if (collected.has(k.id)) return false

			if (k.combinedScore < DEFAULT_SIMILARITY_THRESHOLD * 0.8) return false

			return true
		})
	}

	private filterByQuality(memory: Array<Memory>, threshold: number): Array<Memory> {
		return memory.filter(k => k.combinedScore >= threshold)
	}

	private generateNextQuery(
		original_query: string,
		new_memory: Array<Memory>,
		used_queries: Set<string>
	): string | null {
		const content_text = new_memory.map(k => k.content).join(' ')
		const keywords = extractKeywords(content_text)

		if (keywords.length === 0) return null

		// Build query: original query + top keywords
		const top_keywords = keywords.slice(0, 3)
		const candidate_query = `${original_query} ${top_keywords.join(' ')}`

		// Check if this query was already used
		if (used_queries.has(candidate_query)) {
			// Try alternative combination
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

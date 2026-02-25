import { injectable } from 'tsyringe'

import { DEFAULT_SIMILARITY_THRESHOLD } from './consts'
import Polywise from './Polywise'
import { ChainEmitter, extractKeywords, processResults } from './utils'

import type { CortexProcessArgs } from './types/cortex'
import type { Memory } from './types/polywise'

@injectable()
export default class Cortex {
	private p!: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async process(args: CortexProcessArgs) {
		const { query, cot_depth = 0, process } = args

		const has_explicit_cot = args.cot_depth !== undefined && args.cot_depth !== null

		const emitter = new ChainEmitter()

		if (process) {
			emitter.on((_data, steps) => {
				process.emit('cot', steps)
			})
		}

		if (cot_depth <= 1) {
			return await this.executeSingleSearch(query, args, emitter, has_explicit_cot)
		}

		return await this.executeIterativeSearch(query, args, emitter)
	}

	private async executeSingleSearch(
		query: string,
		args: CortexProcessArgs,
		emitter: ChainEmitter,
		has_explicit_cot: boolean
	) {
		const { memory } = await this.p.executeSingleSearch({
			query,
			recall_depth: args.recall_depth,
			search_limit: args.search_limit,
			rerank_limit: args.rerank_limit,
			stimulate_on_recall: args.stimulate_on_recall,
			idol_id: args.idol_id,
			root_ids: args.root_ids,
			context_id: args.context_id,
			process: args.process
		})

		const { memory: final_memory } = await processResults(query, memory, this.p.pipeline)

		emitter.finish({ memory: final_memory })

		return {
			memory: final_memory,
			cot: has_explicit_cot ? emitter : null
		}
	}

	private async executeIterativeSearch(original_query: string, args: CortexProcessArgs, emitter: ChainEmitter) {
		const { cot_depth = 2, process } = args

		const collected_memory = new Map<string, Memory>()
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

		const { memory: final_memory } = await processResults(original_query, filtered_memory, this.p.pipeline)

		emitter.finish({ memory: final_memory })

		return {
			memory: final_memory,
			cot: emitter
		}
	}

	private filterNewMemory(new_memory: Array<Memory>, collected: Map<string, Memory>): Array<Memory> {
		return new_memory.filter(k => {
			if (collected.has(k.id)) return false

			if (k.score < DEFAULT_SIMILARITY_THRESHOLD * 0.8) return false

			return true
		})
	}

	private filterByQuality(memory: Array<Memory>, threshold: number): Array<Memory> {
		return memory.filter(k => k.score >= threshold)
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

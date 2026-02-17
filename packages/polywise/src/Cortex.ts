import { injectable } from 'tsyringe'

import { DEFAULT_SIMILARITY_THRESHOLD } from './consts'
import Polywise from './Polywise'
import { ChainEmitter, extractKeywords, processResults } from './utils'

import type { CortexProcessArgs } from './types/cortex'
import type { Knowledge } from './types/polywise'

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
		const { knowledges } = await this.p.executeSingleSearch({
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

		const { knowledges: k_strings, metadata } = await processResults(query, knowledges, this.p.pipeline)

		return {
			knowledges: k_strings,
			metadata,
			cot: (emitter.finish({ knowledges: k_strings, metadata }) as any) || emitter
		}
	}

	private async executeIterativeSearch(original_query: string, args: CortexProcessArgs, emitter: ChainEmitter) {
		const { cot_depth = 2, process } = args

		// Track all collected knowledges (for deduplication)
		const collected_knowledges = new Map<number, Knowledge>()
		const used_queries = new Set<string>()

		let current_query = original_query
		used_queries.add(current_query)

		// Iterative search rounds
		for (let depth = 0; depth < cot_depth; depth++) {
			process?.emit('cot_iteration', { depth: depth + 1, query: current_query })

			// Execute search for current query
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

			// Filter and collect high-quality results
			const new_knowledges = this.filterNewKnowledges(search_results.knowledges, collected_knowledges)

			if (new_knowledges.length === 0) {
				process?.emit('cot_converged', { depth: depth + 1, reason: 'no_new_results' })
				break
			}

			// Add new knowledges to collection
			for (const k of new_knowledges) {
				collected_knowledges.set(k.id, k)
			}

			process?.emit('cot_iteration_results', {
				depth: depth + 1,
				new_results: new_knowledges.length,
				total_results: collected_knowledges.size
			})

			// Generate next query for next iteration (if not last round)
			if (depth < cot_depth - 1) {
				const next_query = this.generateNextQuery(original_query, new_knowledges, used_queries)

				if (!next_query || used_queries.has(next_query)) {
					process?.emit('cot_converged', { depth: depth + 1, reason: 'no_new_query' })
					break
				}

				current_query = next_query
				used_queries.add(current_query)
			}
		}

		// Convert collected knowledges to array and process
		const all_knowledges = Array.from(collected_knowledges.values())

		// Final rerank to ensure quality
		const filtered_knowledges = this.filterByQuality(all_knowledges, DEFAULT_SIMILARITY_THRESHOLD)

		const { knowledges: k_strings, metadata } = await processResults(
			original_query,
			filtered_knowledges,
			this.p.pipeline
		)

		return {
			knowledges: k_strings,
			metadata,
			cot: (emitter.finish({ knowledges: k_strings, metadata }) as any) || emitter
		}
	}

	private filterNewKnowledges(
		new_knowledges: Array<Knowledge>,
		collected: Map<number, Knowledge>
	): Array<Knowledge> {
		return new_knowledges.filter(k => {
			// Skip if already collected (by id)
			if (collected.has(k.id)) return false

			// Skip if combined score is too low
			if (k.combinedScore < DEFAULT_SIMILARITY_THRESHOLD * 0.8) return false

			return true
		})
	}

	private filterByQuality(knowledges: Array<Knowledge>, threshold: number): Array<Knowledge> {
		return knowledges.filter(k => k.combinedScore >= threshold)
	}

	private generateNextQuery(
		original_query: string,
		new_knowledges: Array<Knowledge>,
		used_queries: Set<string>
	): string | null {
		// Extract keywords from new knowledges
		const content_text = new_knowledges.map(k => k.content).join(' ')
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

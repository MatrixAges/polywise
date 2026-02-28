import { SEQUENCE_CONTEXT_BOOST } from '../consts'
import calculateMemoryStrength from './calculateMemoryStrength'
import calculateRecencyWeight from './calculateRecencyWeight'

import type { AggregateResultsArgs, Memory, SearchResult } from '../types'

export async function aggregateResults(args: AggregateResultsArgs) {
	const { recall_result, search_results, sequence_context_id } = args

	const memory: Array<Memory> = []
	const seen_ids = new Set<string>()

	collectMemoryResults(recall_result, search_results, memory, seen_ids, sequence_context_id)

	collectExternalResults(recall_result, search_results, memory, seen_ids, sequence_context_id)

	return { memory }
}

function collectMemoryResults(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: Array<SearchResult>,
	memory: Array<Memory>,
	seen_ids: Set<string>,
	sequence_context_id?: string | null
) {
	for (const context of recall_result.related_contexts) {
		for (const article_id of context.article_ids) {
			const article = search_results.find(r => r.id === article_id)

			if (article) {
				if (seen_ids.has(article.id)) continue

				const memory_strength = calculateMemoryStrength(context)
				const recency_weight = calculateRecencyWeight(article.updated_at)
				const sequence_weight =
					sequence_context_id && article.context_id === sequence_context_id
						? SEQUENCE_CONTEXT_BOOST
						: 1

				memory.push({
					id: article.id,
					content: article.content,
					score: article.rerankScore + 0.1,
					memoryStrength: memory_strength * recency_weight * sequence_weight,
					source: 'memory',
					stimulated: true,
					metadata: (article as any).metadata ?? {},
					updated_at: (article as any).updated_at,
					context_id: article.context_id
				})
				seen_ids.add(article.id)
			}
		}
	}
}

function collectExternalResults(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: Array<SearchResult>,
	memory: Array<Memory>,
	seen_ids: Set<string>,
	sequence_context_id?: string | null
) {
	const stimulated_node_ids = new Set(recall_result.stimulated_nodes)
	const node_potential_map = new Map<string, number>()

	for (const node of recall_result.nodes) {
		node_potential_map.set(node.id, node.potential)
	}

	for (const result of search_results) {
		if (seen_ids.has(result.id)) continue

		const is_stimulated = stimulated_node_ids.has(result.id)
		const memory_strength = node_potential_map.get(result.id) ?? 0
		const recency_weight = calculateRecencyWeight(result.updated_at)
		const sequence_weight =
			sequence_context_id && result.context_id === sequence_context_id ? SEQUENCE_CONTEXT_BOOST : 1

		memory.push({
			id: result.id,
			content: result.content,
			score: result.rerankScore,
			memoryStrength: memory_strength * recency_weight * sequence_weight,
			source: is_stimulated ? 'memory' : 'external',
			stimulated: is_stimulated,
			metadata: (result as any).metadata ?? {},
			updated_at: (result as any).updated_at,
			context_id: result.context_id
		})
		seen_ids.add(result.id)
	}
}

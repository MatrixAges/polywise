import calculateMemoryStrength from './calculateMemoryStrength'

import type { AggregateResultsArgs, Memory, SearchResult } from '../types'

export async function aggregateResults(args: AggregateResultsArgs) {
	const { recall_result, search_results } = args

	const memory: Array<Memory> = []
	const seen_ids = new Set<string>()

	collectMemoryResults(recall_result, search_results, memory, seen_ids)

	collectExternalResults(recall_result, search_results, memory, seen_ids)

	return { memory }
}

function collectMemoryResults(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: Array<SearchResult>,
	memory: Array<Memory>,
	seen_ids: Set<string>
) {
	for (const context of recall_result.related_contexts) {
		for (const article_id of context.article_ids) {
			const article = search_results.find(r => r.id === article_id)

			if (article) {
				if (seen_ids.has(article.id)) continue

				const memory_strength = calculateMemoryStrength(context)

				memory.push({
					id: article.id,
					content: article.content,
					score: article.rerankScore + 0.1,
					memoryStrength: memory_strength,
					source: 'memory',
					stimulated: true,
					metadata: (article as any).metadata ?? {},
					updated_at: (article as any).updated_at
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
	seen_ids: Set<string>
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

		memory.push({
			id: result.id,
			content: result.content,
			score: result.rerankScore,
			memoryStrength: memory_strength,
			source: is_stimulated ? 'memory' : 'external',
			stimulated: is_stimulated,
			metadata: (result as any).metadata ?? {},
			updated_at: (result as any).updated_at
		})
		seen_ids.add(result.id)
	}
}

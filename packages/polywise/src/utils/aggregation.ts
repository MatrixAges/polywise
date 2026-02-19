import { MEMORY_SCORE_BOOST, POTENTIAL_THRESHOLD } from '../consts'
import calculateMemoryStrength from './calculateMemoryStrength'

import type { AggregateResultsArgs, Memory } from '../types'

export async function aggregateResults(args: AggregateResultsArgs) {
	const { recall_result, search_results } = args

	const memory: Array<Memory> = []

	collectMemoryResults(recall_result, search_results, memory)

	collectExternalResults(recall_result, search_results, memory)

	collectImplicitResults(recall_result, memory)

	return { memory }
}

function collectMemoryResults(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: Array<any>,
	memory: Array<Memory>
) {
	for (const context of recall_result.related_contexts) {
		for (const article_id of context.article_ids) {
			const article = search_results.find(r => r.id === article_id)

			if (article) {
				const memory_strength = calculateMemoryStrength(context)

				memory.push({
					id: article.id,
					content: article.content,
					score: MEMORY_SCORE_BOOST,
					memoryStrength: memory_strength,
					source: 'memory',
					stimulated: true,
					metadata: (article as any).metadata ?? {},
					updated_at: (article as any).updated_at
				})
			}
		}
	}
}

function collectExternalResults(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: Array<any>,
	memory: Array<Memory>
) {
	const stimulated_node_ids = new Set(recall_result.stimulated_nodes)
	const node_potential_map = new Map<string, number>()

	for (const node of recall_result.nodes) {
		node_potential_map.set(node.id, node.potential)
	}

	for (const result of search_results) {
		if (!memory.find(c => c.id === result.id)) {
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
		}
	}
}

function collectImplicitResults(recall_result: AggregateResultsArgs['recall_result'], memory: Array<Memory>) {
	const high_potential_nodes = recall_result.nodes
		.filter(n => n.potential > POTENTIAL_THRESHOLD && !memory.find(k => k.id === n.id))
		.slice(0, 5)

	for (const node of high_potential_nodes) {
		memory.push({
			id: node.id,
			content: node.label,
			score: node.potential,
			memoryStrength: node.potential,
			source: 'implicit',
			stimulated: true,
			metadata: node.metadata ?? {},
			updated_at: node.updated_at
		})
	}
}

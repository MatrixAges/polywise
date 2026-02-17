import { MEMORY_SCORE_BOOST, POTENTIAL_THRESHOLD, RELEVANCE_SCORE_FACTOR } from '../consts'
import calculateMemoryStrength from './calculateMemoryStrength'

import type { AggregateResultsArgs, Knowledge } from '../types'

export async function aggregateResults(args: AggregateResultsArgs) {
	const { recall_result, search_results } = args

	const knowledges: Array<Knowledge> = []

	collectMemoryKnowledges(recall_result, search_results, knowledges)

	collectExternalResults(recall_result, search_results, knowledges)

	collectImplicitResults(recall_result, knowledges)

	return { knowledges }
}

function collectMemoryKnowledges(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: Array<any>,
	knowledges: Array<Knowledge>
) {
	for (const context of recall_result.related_contexts) {
		for (const article_id of context.article_ids) {
			const article = search_results.find(r => r.id === article_id)

			if (article) {
				const memory_strength = calculateMemoryStrength(context)

				knowledges.push({
					id: article.id,
					content: article.content,
					rerankScore: article.rerankScore,
					relevanceScore: MEMORY_SCORE_BOOST,
					memoryStrength: memory_strength,
					combinedScore: 0,
					source: 'memory',
					stimulated: true,
					metadata: (article as any).metadata
				})
			}
		}
	}
}

function collectExternalResults(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: Array<any>,
	knowledges: Array<Knowledge>
) {
	const stimulated_node_ids = new Set(recall_result.stimulated_nodes)
	const node_potential_map = new Map<number, number>()

	for (const node of recall_result.nodes) {
		node_potential_map.set(node.id, node.potential)
	}

	for (const result of search_results) {
		if (!knowledges.find(c => c.id === result.id)) {
			const is_stimulated = stimulated_node_ids.has(result.id)
			const memory_strength = node_potential_map.get(result.id) ?? 0

			knowledges.push({
				id: result.id,
				content: result.content,
				rerankScore: result.rerankScore,
				relevanceScore: result.rerankScore,
				memoryStrength: memory_strength,
				combinedScore: 0,
				source: is_stimulated ? 'memory' : 'external',
				stimulated: is_stimulated,
				metadata: (result as any).metadata
			})
		}
	}
}

function collectImplicitResults(recall_result: AggregateResultsArgs['recall_result'], knowledges: Array<Knowledge>) {
	const high_potential_nodes = recall_result.nodes
		.filter(n => n.potential > POTENTIAL_THRESHOLD && !knowledges.find(k => k.id === n.id))
		.slice(0, 5)

	for (const node of high_potential_nodes) {
		knowledges.push({
			id: node.id,
			content: node.label,
			rerankScore: node.potential,
			relevanceScore: node.potential * RELEVANCE_SCORE_FACTOR,
			memoryStrength: node.potential,
			combinedScore: 0,
			source: 'implicit' as any,
			stimulated: true,
			metadata: node.metadata
		})
	}
}

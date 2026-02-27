import { system } from '../consts'

import type { Memory, RecallResult, SearchResult } from '../types'

interface AggregateResultsArgs {
	recall_res: RecallResult
	target_results: Array<SearchResult>
	sequence_context_id?: string | null
}

export default async (args: AggregateResultsArgs) => {
	const { recall_res, target_results, sequence_context_id } = args

	const memory: Array<Memory> = []
	const seen_ids = new Set<string>()

	collectMemoryResults(recall_res, target_results, memory, seen_ids, sequence_context_id)
	collectExternalResults(recall_res, target_results, memory, seen_ids, sequence_context_id)

	return { memory }
}

const collectMemoryResults = (
	recall_res: AggregateResultsArgs['recall_res'],
	target_results: Array<SearchResult>,
	memory: Array<Memory>,
	seen_ids: Set<string>,
	sequence_context_id?: string | null
) => {
	for (const context of recall_res.related_contexts) {
		for (const article_id of context.article_ids) {
			const article = target_results.find(r => r.id === article_id)

			if (article) {
				if (seen_ids.has(article.id)) continue

				const memory_strength = (context.relevance_score ?? 1.0) * 0.5 + 0.5
				const recency_weight = calculateRecencyWeight(article.updated_at)
				const sequence_weight =
					sequence_context_id && article.context_id === sequence_context_id
						? system.sequence_context_boost
						: 1

				memory.push({
					id: article.id,
					content: article.content,
					score: article.score + 0.1,
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

const collectExternalResults = (
	recall_res: AggregateResultsArgs['recall_res'],
	target_results: Array<SearchResult>,
	memory: Array<Memory>,
	seen_ids: Set<string>,
	sequence_context_id?: string | null
) => {
	const stimulated_node_ids = new Set(recall_res.stimulated_nodes)
	const node_potential_map = new Map<string, number>()

	for (const node of recall_res.nodes) {
		node_potential_map.set(node.id, node.potential)
	}

	for (const result of target_results) {
		if (seen_ids.has(result.id)) continue

		const is_stimulated = stimulated_node_ids.has(result.id)
		const memory_strength = node_potential_map.get(result.id) ?? 0
		const recency_weight = calculateRecencyWeight(result.updated_at)
		const sequence_weight =
			sequence_context_id && result.context_id === sequence_context_id ? system.memory_score_boost : 1

		memory.push({
			id: result.id,
			content: result.content,
			score: result.score,
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

const calculateRecencyWeight = (updated_at?: string) => {
	if (!updated_at) return system.recency_max_weight

	const timestamp = Date.parse(updated_at)

	if (!Number.isFinite(timestamp)) return system.recency_max_weight

	const age_ms = Date.now() - timestamp

	if (age_ms <= 0) return system.recency_max_weight

	const age_days = age_ms / (1000 * 60 * 60 * 24)
	const decay = Math.exp(-age_days / system.recency_half_life_days)
	const weight = system.recency_min_weight + (system.recency_max_weight - system.recency_min_weight) * decay

	return Math.min(system.recency_max_weight, Math.max(system.recency_min_weight, weight))
}

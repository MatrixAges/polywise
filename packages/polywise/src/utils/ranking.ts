import {
	formatSourceInfo,
	PRIORITY_WEIGHTS,
	RELEVANCE_SCORE_WEIGHT,
	RERANK_SCORE_WEIGHT,
	STIMULATION_MAX,
	STIMULATION_MIN
} from '../consts'
import * as sql_brain from '../sql/Brain'

import type Pipeline from '../Pipeline'
import type { Action, Knowledge } from '../types'

export async function rerankKnowledges(
	query: string,
	candidates: Knowledge[],
	limit: number,
	pipeline: Pipeline,
	queryRaw: (sql: string, params?: any[]) => Promise<any>
) {
	if (candidates.length === 0) return []

	const documents = candidates.map(c => {
		const source_info = formatSourceInfo(c.source, c.stimulated, c.memoryStrength)

		return `\${source_info} [Type: info]\\n\${c.content}`
	})

	const rerank_scores = await pipeline.rerank(query, documents)

	const results: Knowledge[] = candidates.map((candidate, index) => {
		const rerankScore = rerank_scores[index]?.score ?? 0
		const priority_weight = (PRIORITY_WEIGHTS as any)[candidate.source] ?? PRIORITY_WEIGHTS.external

		return {
			...candidate,
			rerankScore,
			combinedScore:
				(rerankScore * RERANK_SCORE_WEIGHT + candidate.relevanceScore * RELEVANCE_SCORE_WEIGHT) *
				priority_weight
		}
	})

	const sorted_results = results.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit)

	await stimulateByRanking(sorted_results, queryRaw)

	return sorted_results
}

export async function rerankActions(
	query: string,
	candidates: Action[],
	limit: number,
	pipeline: Pipeline,
	queryRaw: (sql: string, params?: any[]) => Promise<any>
) {
	if (candidates.length === 0) {
		return []
	}

	const documents = candidates.map(c => {
		const source_info = formatSourceInfo(c.source, c.stimulated, c.memoryStrength)

		return `\${source_info} [Type: action]\\n\${c.content}`
	})

	const rerank_scores = await pipeline.rerank(query, documents)

	const results: Action[] = candidates.map((candidate, index) => {
		const rerankScore = rerank_scores[index]?.score ?? 0
		const priority_weight = (PRIORITY_WEIGHTS as any)[candidate.source] ?? PRIORITY_WEIGHTS.external

		return {
			...candidate,
			rerankScore,
			combinedScore:
				(rerankScore * RERANK_SCORE_WEIGHT + candidate.relevanceScore * RELEVANCE_SCORE_WEIGHT) *
				priority_weight
		}
	})

	const sorted_results = results.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit)

	await stimulateByRanking(sorted_results, queryRaw)

	return sorted_results
}

async function stimulateByRanking(
	results: (Knowledge | Action)[],
	queryRaw: (sql: string, params?: any[]) => Promise<any>
) {
	if (results.length === 0) return

	const max_stimulation = STIMULATION_MAX
	const min_stimulation = STIMULATION_MIN
	const decay_rate = (max_stimulation - min_stimulation) / Math.max(results.length - 1, 1)
	const stimulation_map = new Map<number, number>()

	for (let i = 0; i < results.length; i++) {
		const intensity = Math.max(max_stimulation - i * decay_rate, min_stimulation)

		stimulation_map.set(results[i].id, intensity)
	}

	const node_ids = Array.from(stimulation_map.keys())
	const intensities = node_ids.map(id => stimulation_map.get(id)!)

	for (let i = 0; i < node_ids.length; i++) {
		await queryRaw(sql_brain.sql_stimulate_nodes_batch, [intensities[i], [node_ids[i]]])
	}
}

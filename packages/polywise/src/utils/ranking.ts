import {
	DEFAULT_SIMILARITY_THRESHOLD,
	formatRerankDocument,
	formatSourceInfo,
	STIMULATION_MAX,
	STIMULATION_MIN
} from '../consts'
import { sql_get_article_embedding, sql_stimulate_nodes_batch } from '../sql'
import { maximalMarginalRelevance } from './mmr'

import type Pipeline from '../Pipeline'
import type { Memory } from '../types'

export async function rerankMemory(
	query: string,
	candidates: Array<Memory>,
	limit: number,
	pipeline: Pipeline,
	queryRaw: (sql: string, params?: Array<any>) => Promise<any>,
	threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
	lambda: number = 0.5
) {
	const valid_candidates = candidates.filter(c => c.content && c.content.trim().length > 0)

	if (valid_candidates.length === 0) return []

	const documents = valid_candidates.map(c => {
		const source_info = formatSourceInfo(c.source, c.stimulated, c.memoryStrength)

		return formatRerankDocument(source_info, c.content)
	})

	const rerank_scores = await pipeline.rerank(query, documents)

	const results_with_scores = valid_candidates.map((candidate, index) => {
		const score = rerank_scores[index]?.score ?? 0

		return {
			...candidate,
			score
		}
	})

	// Pre-filter by threshold to save on embedding lookups for low-quality results
	const thresholded_results = results_with_scores.filter(r => r.score >= threshold)

	if (thresholded_results.length === 0) return []

	// Retrieve embeddings for MMR
	const results_with_embeddings = await Promise.all(
		thresholded_results.map(async candidate => {
			let embedding: Array<number> | undefined = undefined

			// Try to fetch embedding from database first
			try {
				const embedding_res = await queryRaw(sql_get_article_embedding, [candidate.id])
				if (embedding_res && embedding_res.length > 0 && embedding_res[0].embedding) {
					embedding = embedding_res[0].embedding as Array<number>
				}
			} catch (err) {
				// Ignore db error, fallback to calculate
			}

			// If no embedding in DB, compute it
			if (!embedding && candidate.content) {
				embedding = (await pipeline.embed(candidate.content)) as Array<number>
			}

			return {
				...candidate,
				embedding
			}
		})
	)

	// Apply MMR
	const mmr_results = maximalMarginalRelevance(results_with_embeddings, limit, lambda)

	// Clean up embedding records to return Memory type correctly
	const final_results: Array<Memory> = mmr_results.map(item => {
		const { embedding, ...rest } = item
		return rest as Memory
	})

	await stimulateByRanking(final_results, queryRaw)

	return final_results
}

async function stimulateByRanking(
	results: Array<Memory>,
	queryRaw: (sql: string, params?: Array<any>) => Promise<any>
) {
	if (results.length === 0) return

	const max_stimulation = STIMULATION_MAX
	const min_stimulation = STIMULATION_MIN
	const decay_rate = (max_stimulation - min_stimulation) / Math.max(results.length - 1, 1)
	const stimulation_map = new Map<string, number>()

	for (let i = 0; i < results.length; i++) {
		const intensity = Math.max(max_stimulation - i * decay_rate, min_stimulation)

		stimulation_map.set(results[i].id, intensity)
	}

	const node_ids = Array.from(stimulation_map.keys())
	const intensities = node_ids.map(id => stimulation_map.get(id)!)

	for (let i = 0; i < node_ids.length; i++) {
		await queryRaw(sql_stimulate_nodes_batch, [intensities[i], [node_ids[i]]])
	}
}

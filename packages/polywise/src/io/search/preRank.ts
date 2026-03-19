import { chunk } from '@core/db/schema'
import { env } from '@core/env'
import { log } from '@core/utils'
import { inArray } from 'drizzle-orm'

interface RrfScore {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
}

interface TimeWeightedResult extends RrfScore {
	time_weight: number
	final_score: number
}

export default async (rrf_results: Array<RrfScore>) => {
	if (rrf_results.length === 0) return []

	const chunk_ids = rrf_results.map(item => item.chunk_id)

	const chunks = await env.db
		.select({ id: chunk.id, updated_at: chunk.created_at })
		.from(chunk)
		.where(inArray(chunk.id, chunk_ids))

	const time_map = new Map<string, number>()

	chunks.forEach(c => {
		if (c.updated_at) {
			time_map.set(c.id, c.updated_at.getTime())
		}
	})

	const now = Date.now()
	const day_ms = 24 * 60 * 60 * 1000

	log('SEARCH', 'preRankByTime', () => `result_count: ${rrf_results.length}`)

	return rrf_results
		.map(item => {
			const updated_at = time_map.get(item.chunk_id) || now
			const days_ago = (now - updated_at) / day_ms

			const time_weight = 1 / (1 + days_ago * 0.1)
			const final_score = item.normalized_rrf_score * 0.7 + time_weight * 0.3

			return {
				...item,
				time_weight,
				final_score
			} as TimeWeightedResult
		})
		.sort((a, b) => b.final_score - a.final_score)
}

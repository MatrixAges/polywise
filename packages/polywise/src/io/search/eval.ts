import { log } from '@core/utils'

interface SearchResult {
	chunk_id: string
	rank: number
}

interface RrfScore {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
}

export default (
	kw_list: Array<SearchResult>,
	q_list: Array<SearchResult>,
	ans_list: Array<SearchResult>,
	k: number = 60
) => {
	const score_map = new Map<string, number>()

	const apply_rrf = (list: Array<SearchResult>, weight: number) => {
		list.forEach(item => {
			const current_score = score_map.get(item.chunk_id) || 0
			const additional_score = weight * (1 / (k + item.rank))

			score_map.set(item.chunk_id, current_score + additional_score)
		})
	}

	apply_rrf(kw_list, 2)
	apply_rrf(q_list, 2)
	apply_rrf(ans_list, 1)

	const sorted_rrf = Array.from(score_map.entries())
		.map(([chunk_id, rrf_score]) => ({ chunk_id, rrf_score }))
		.sort((a, b) => b.rrf_score - a.rrf_score)

	const max_rrf_score = sorted_rrf[0]?.rrf_score || 1

	log('SEARCH', 'calculateWeightedRRF', () => `result_count: ${sorted_rrf.length}`)

	return sorted_rrf.map((item, index) => ({
		chunk_id: item.chunk_id,
		rrf_score: item.rrf_score,
		normalized_rrf_score: item.rrf_score / max_rrf_score,
		rrf_rank: index + 1
	})) as Array<RrfScore>
}

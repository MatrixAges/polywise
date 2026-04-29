import {
	answer_vector_rrf_weight,
	keyword_rrf_weight,
	question_vector_rrf_weight,
	recall_rrf_weight,
	rrf_k
} from '@core/consts/search'
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
	from_recall: boolean
	from_keyword: boolean
}

export default (
	kw_list: Array<SearchResult>,
	q_list: Array<SearchResult>,
	ans_list: Array<SearchResult>,
	recall_list: Array<SearchResult> = []
) => {
	const score_map = new Map<string, number>()
	const recall_chunk_ids = new Set<string>()
	const keyword_chunk_ids = new Set<string>()

	const applyRrf = (
		list: Array<SearchResult>,
		weight: number,
		isRecall: boolean = false,
		isKeyword: boolean = false
	) => {
		list.forEach(item => {
			const current_score = score_map.get(item.chunk_id) || 0
			const additional_score = weight * (1 / (rrf_k + item.rank))

			score_map.set(item.chunk_id, current_score + additional_score)
			if (isRecall) recall_chunk_ids.add(item.chunk_id)
			if (isKeyword) keyword_chunk_ids.add(item.chunk_id)
		})
	}

	applyRrf(kw_list, keyword_rrf_weight, false, true)
	applyRrf(q_list, question_vector_rrf_weight)
	applyRrf(ans_list, answer_vector_rrf_weight)
	applyRrf(recall_list, recall_rrf_weight, true)

	const sorted_rrf = Array.from(score_map.entries())
		.map(([chunk_id, rrf_score]) => ({ chunk_id, rrf_score }))
		.sort((a, b) => b.rrf_score - a.rrf_score)

	const max_rrf_score = sorted_rrf[0]?.rrf_score || 1

	log('SEARCH', 'calculateWeightedRRF', () => `result_count: ${sorted_rrf.length}`)

	return sorted_rrf.map((item, index) => ({
		chunk_id: item.chunk_id,
		rrf_score: item.rrf_score,
		normalized_rrf_score: item.rrf_score / max_rrf_score,
		rrf_rank: index + 1,
		from_recall: recall_chunk_ids.has(item.chunk_id),
		from_keyword: keyword_chunk_ids.has(item.chunk_id)
	})) as Array<RrfScore>
}

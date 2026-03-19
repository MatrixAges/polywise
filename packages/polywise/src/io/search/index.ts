import { getSearchTarget } from '@core/pipeline'
import { log } from '@core/utils'

import eval_rrf from './eval'
import preRank from './preRank'
import reRank from './reRank'
import searchByKeywords from './searchByKeywords'
import searchByVector from './searchByVector'

interface ArgsSearch {
	query: string
	intent?: string
	rank_by_time?: boolean
}

export default async (args: ArgsSearch) => {
	const { query, intent, rank_by_time } = args

	log('SEARCH', 'start', () => `query: ${query}, intent: ${intent}`)

	const search_target = await getSearchTarget(query, intent)

	log('SEARCH', 'getSearchTarget', () => search_target)

	const [kw_results, q_results, ans_results] = await Promise.all([
		searchByKeywords(search_target.keywords),
		searchByVector(search_target.question),
		searchByVector(search_target.answer)
	])

	log('SEARCH', 'searchDone', () => ({
		kw_count: kw_results.length,
		q_count: q_results.length,
		ans_count: ans_results.length
	}))

	const rrf_results = eval_rrf(kw_results, q_results, ans_results)

	log('SEARCH', 'rrfDone', () => `result_count: ${rrf_results.length}`)

	if (rank_by_time) {
		const preranked = await preRank(rrf_results)

		log('SEARCH', 'preRankDone', () => `result_count: ${preranked.length}`)

		const reranked = await reRank(query, preranked)

		log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

		return reranked
	}

	const reranked = await reRank(query, rrf_results)

	log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

	return reranked
}

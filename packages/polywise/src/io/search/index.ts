import { getSearchTarget } from '@core/pipeline'
import { log } from '@core/utils'

import evaluate from './evaluate'
import lookup, { ArticleWithScore } from './lookup'
import prerank from './prerank'
import rerank, { RerankedResult } from './rerank'
import searchByKeywords from './searchByKeywords'
import searchByVector from './searchByVector'

interface ArgsSearch {
	query: string
	intent?: string
	rank_by_time?: boolean
	type?: 'chunk' | 'article'
}

interface ChunkResult {
	id: string
	content: string
	score: number
}

interface SearchOutput {
	type: 'chunk' | 'article'
	results: Array<ChunkResult>
}

export default async (args: ArgsSearch): Promise<SearchOutput> => {
	const { query, intent, rank_by_time, type = 'article' } = args

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

	const rrf_results = evaluate(kw_results, q_results, ans_results)

	log('SEARCH', 'rrfDone', () => `result_count: ${rrf_results.length}`)

	if (rank_by_time) {
		const preranked = await prerank(rrf_results)

		log('SEARCH', 'preRankDone', () => `result_count: ${preranked.length}`)

		const reranked = await rerank(query, preranked)

		log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

		if (type === 'chunk') {
			return {
				type: 'chunk',
				results: reranked.slice(0, 6).map(item => ({
					id: item.chunk_id,
					content: item.content,
					score: item.final_score
				}))
			}
		}

		const articles = await lookup(reranked)

		log('SEARCH', 'articleLookup', () => `article_count: ${articles.length}`)

		return {
			type: 'article',
			results: articles.slice(0, 3).map(item => ({
				id: item.article_id,
				content: item.article_content,
				score: item.final_score
			}))
		}
	}

	const reranked = await rerank(query, rrf_results)

	log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

	if (type === 'chunk') {
		return {
			type: 'chunk',
			results: reranked.slice(0, 6).map(item => ({
				id: item.chunk_id,
				content: item.content,
				score: item.final_score
			}))
		}
	}

	const articles = await lookup(reranked)

	log('SEARCH', 'articleLookup', () => `article_count: ${articles.length}`)

	return {
		type: 'article',
		results: articles.slice(0, 3).map(item => ({
			id: item.article_id,
			content: item.article_content,
			score: item.final_score
		}))
	}
}

import { getSearchTarget } from '@core/pipeline'
import { log } from '@core/utils'
import { z } from 'zod'

import { input_type } from '../../rpc/search'
import evaluate from './evaluate'
import lookup from './lookup'
import prerank from './prerank'
import rankByTime from './rankByTime'
import rerank, { rerankArticle, RerankedArticleResult } from './rerank'
import searchByKeywords from './searchByKeywords'
import searchByVector from './searchByVector'

export type ArgsSearch = z.infer<typeof input_type>

interface ChunkResult {
	id: string
	content: string
	score: number
}

interface SearchOutput {
	type: 'chunk' | 'article'
	results: Array<ChunkResult>
}

interface ArticleSearchResult {
	article_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
}

export default async (args: ArgsSearch): Promise<SearchOutput> => {
	const { query, intent, enable_rewrite = false, rank_by_time, type = 'article' } = args

	log('SEARCH', 'start', () => `query: ${query}, intent: ${intent}, enable_rewrite: ${enable_rewrite}`)

	let search_keywords: string
	let search_question: string
	let search_answer: string
	let rerank_query: string

	if (enable_rewrite) {
		const search_target = await getSearchTarget(query, intent)

		log('SEARCH', 'getSearchTarget', () => search_target)

		search_keywords = search_target.keywords
		search_question = search_target.question
		search_answer = search_target.answer
		rerank_query = search_target.question
	} else {
		const combined_query = [query, intent].filter(Boolean).join(' ').trim()

		search_keywords = combined_query
		search_question = combined_query
		search_answer = ''
		rerank_query = combined_query
	}

	const [kw_results, q_results, ans_results] = await Promise.all([
		searchByKeywords(search_keywords),
		searchByVector(search_question),
		search_answer ? searchByVector(search_answer) : Promise.resolve([])
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

		return await rankByTime(rerank_query, preranked, type)
	}

	if (type === 'chunk') {
		const reranked = await rerank(rerank_query, rrf_results)

		log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

		return {
			type: 'chunk',
			results: reranked.map(item => ({
				id: item.chunk_id,
				content: item.content,
				score: item.final_score
			}))
		}
	}

	const reranked = await rerank(rerank_query, rrf_results)

	log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

	const article_scores = await lookup(reranked)

	log('SEARCH', 'articleLookup', () => `article_count: ${article_scores.length}`)

	if (article_scores.length === 0) {
		return { type: 'article', results: [] }
	}

	const article_search_results: Array<ArticleSearchResult> = article_scores.map(a => ({
		article_id: a.article_id,
		rrf_score: a.rrf_score,
		normalized_rrf_score: a.normalized_rrf_score,
		rrf_rank: a.rrf_rank
	}))

	const reranked_articles: Array<RerankedArticleResult & { article_id: string }> = await rerankArticle(
		rerank_query,
		article_search_results
	)

	log('SEARCH', 'articleRerankDone', () => `result_count: ${reranked_articles.length}`)

	return {
		type: 'article',
		results: reranked_articles.map(item => ({
			id: item.article_id,
			content: item.content,
			score: item.final_score
		}))
	}
}

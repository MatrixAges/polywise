import { log } from '@core/utils'

import lookup, { ArticleWithScore } from './lookup'
import rerank, { rerankArticle, RerankedArticleResult } from './rerank'

interface ChunkResult {
	id: string
	content: string
	score: number
}

interface SearchOutput {
	type: 'chunk' | 'article'
	results: Array<ChunkResult>
}

interface RrfScore {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
}

const mapRerankedToOutput = (
	reranked: Array<{ chunk_id: string; content: string; final_score: number }>,
	type: 'chunk' | 'article'
): SearchOutput => ({
	type,
	results: reranked.map(item => ({
		id: item.chunk_id,
		content: item.content,
		score: item.final_score
	}))
})

export default async (query: string, preranked: Array<RrfScore>, type: 'chunk' | 'article'): Promise<SearchOutput> => {
	const reranked = await rerank(query, preranked)

	log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

	if (type === 'chunk') {
		return mapRerankedToOutput(reranked, 'chunk')
	}

	const article_scores = await lookup(reranked)

	log('SEARCH', 'articleLookup', () => `article_count: ${article_scores.length}`)

	if (article_scores.length === 0) {
		return { type: 'article', results: [] }
	}

	const article_search_results: Array<{
		article_id: string
		rrf_score: number
		normalized_rrf_score: number
		rrf_rank: number
	}> = article_scores.map(a => ({
		article_id: a.article_id,
		rrf_score: a.rrf_score,
		normalized_rrf_score: a.normalized_rrf_score,
		rrf_rank: a.rrf_rank
	}))

	const reranked_articles: Array<RerankedArticleResult & { article_id: string }> = await rerankArticle(
		query,
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

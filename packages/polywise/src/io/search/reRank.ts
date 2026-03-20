import { article, chunk } from '@core/db/schema'
import { env } from '@core/env'
import { addTask, initRerankModel, removeTask } from '@core/llama'
import { log } from '@core/utils'
import { inArray } from 'drizzle-orm'

interface SearchResult {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	final_score?: number
}

interface ArticleSearchResult {
	article_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
}

export interface RerankedResult extends SearchResult {
	reranker_score: number
	final_score: number
	content: string
}

export interface RerankedArticleResult extends ArticleSearchResult {
	reranker_score: number
	final_score: number
	content: string
}

const MIN_RERANK_SCORE = 0.5
const MIN_ARTICLE_RERANK_SCORE = 0.6

const calculateFinalScore = (
	rerank_score: number,
	retrieval_score: number,
	rrf_rank: number,
	is_article: boolean = false
) => {
	const min_score = is_article ? MIN_ARTICLE_RERANK_SCORE : MIN_RERANK_SCORE
	if (rerank_score < min_score) return 0

	if (rrf_rank >= 1 && rrf_rank <= 3) {
		return 0.75 * retrieval_score + 0.25 * rerank_score
	} else if (rrf_rank >= 4 && rrf_rank <= 10) {
		return 0.6 * retrieval_score + 0.4 * rerank_score
	} else {
		return 0.4 * retrieval_score + 0.6 * rerank_score
	}
}

const rerankChunk = async (query: string, results: Array<SearchResult>) => {
	if (results.length === 0) return []

	await initRerankModel()

	const task_id = addTask('rerank')

	const chunk_ids = results.map(item => item.chunk_id)

	const chunks = await env.db
		.select({ id: chunk.id, content: chunk.content })
		.from(chunk)
		.where(inArray(chunk.id, chunk_ids))

	const content_map = new Map<string, string>()

	chunks.forEach(c => {
		if (c.content) {
			content_map.set(c.id, c.content)
		}
	})

	log('SEARCH', 'reRank', () => `query: ${query.slice(0, 50)}, count: ${results.length}`)

	const reranked: Array<RerankedResult> = []

	for (const doc of results) {
		const content = content_map.get(doc.chunk_id) || ''

		const rerank_score = await env.rerank_context.rank(query, content)
		const final_score = calculateFinalScore(rerank_score, doc.normalized_rrf_score, doc.rrf_rank, false)

		if (final_score === 0) continue

		reranked.push({
			...doc,
			reranker_score: rerank_score,
			final_score,
			content
		})
	}

	removeTask('rerank', task_id)

	log('SEARCH', 'reRank done', () => `result_count: ${reranked.length}`)

	return reranked.sort((a, b) => b.final_score - a.final_score)
}

const rerankArticle = async (query: string, results: Array<ArticleSearchResult>) => {
	if (results.length === 0) return []

	await initRerankModel()

	const task_id = addTask('rerank')

	const article_ids = results.map(item => item.article_id)

	const articles = await env.db
		.select({ id: article.id, content: article.content })
		.from(article)
		.where(inArray(article.id, article_ids))

	const content_map = new Map<string, string>()

	articles.forEach(a => {
		if (a.content) {
			content_map.set(a.id, a.content)
		}
	})

	console.log(results)

	log('SEARCH', 'reRankArticle', () => `query: ${query.slice(0, 50)}, count: ${results.length}`)

	const reranked: Array<RerankedArticleResult> = []

	for (const doc of results) {
		const content = content_map.get(doc.article_id) || ''

		const rerank_score = await env.rerank_context.rank(query, content)
		const final_score = calculateFinalScore(rerank_score, doc.normalized_rrf_score, doc.rrf_rank, true)

		if (final_score === 0) continue

		reranked.push({
			...doc,
			reranker_score: rerank_score,
			final_score,
			content
		})
	}

	removeTask('rerank', task_id)

	log('SEARCH', 'reRankArticle done', () => `result_count: ${reranked.length}`)

	return reranked.sort((a, b) => b.final_score - a.final_score)
}

export default rerankChunk
export { rerankArticle }

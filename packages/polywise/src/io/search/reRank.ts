import {
	article_relevance_score_weight,
	article_time_decay_per_day,
	article_time_fallback,
	article_time_score_weight,
	min_article_rerank_score,
	min_keyword_rerank_score,
	min_rerank_score
} from '@core/consts/search'
import { article, chunk } from '@core/db/schema'
import { getArticles, getChunks } from '@core/db/services'
import { env } from '@core/env'
import { addTask, initRerankModel, removeTask } from '@core/llama'
import genRerank from '@core/pipeline/genRerank'
import { log } from '@core/utils'
import { and, inArray } from 'drizzle-orm'

interface SearchResult {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	final_score?: number
	from_keyword?: boolean
}

interface ArticleSearchResult {
	article_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	from_keyword?: boolean
	updated_at: Date | null
	scope_type: string | null
	scope_id: string | null
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

const normalizeText = (text: string) => text.trim().toLowerCase().replace(/\s+/g, '')

const hasDirectTextMatch = (query: string, content: string) => {
	const normalized_query = normalizeText(query)
	const normalized_content = normalizeText(content)

	if (!normalized_query || !normalized_content) return false

	return normalized_content.includes(normalized_query)
}

const calculateFinalScore = (
	rerank_score: number,
	retrieval_score: number,
	rrf_rank: number,
	is_article: boolean = false,
	from_keyword: boolean = false
) => {
	let min_score = is_article ? min_article_rerank_score : min_rerank_score
	if (from_keyword) min_score = min_keyword_rerank_score

	if (rerank_score < min_score) return 0

	if (rrf_rank >= 1 && rrf_rank <= 3) {
		return 0.75 * retrieval_score + 0.25 * rerank_score
	} else if (rrf_rank >= 4 && rrf_rank <= 10) {
		return 0.6 * retrieval_score + 0.4 * rerank_score
	} else {
		return 0.4 * retrieval_score + 0.6 * rerank_score
	}
}

const getTimeWeight = (updated_at: Date | null) => {
	if (!updated_at) return article_time_fallback

	const day_ms = 24 * 60 * 60 * 1000
	const days_ago = Math.max(0, (Date.now() - updated_at.getTime()) / day_ms)

	return 1 / (1 + days_ago * article_time_decay_per_day)
}

const getRerankScores = async (query: string, contents: Array<string>) => {
	const remote_run = await genRerank()

	if (remote_run) {
		return remote_run(query, contents)
	}

	await initRerankModel()

	const scores: Array<number> = []

	for (const content of contents) {
		scores.push(await env.rerank_context.rank(query, content))
	}

	return scores
}

const rerankChunk = async (query: string, results: Array<SearchResult>) => {
	if (results.length === 0) return []

	const task_id = addTask('rerank')

	try {
		const chunk_ids = results.map(item => item.chunk_id)

		const chunks = await getChunks({
			where: inArray(chunk.id, chunk_ids)
		})

		const content_map = new Map<string, string>()

		chunks.forEach(c => {
			if (c.content) {
				content_map.set(c.id, c.content)
			}
		})

		log('SEARCH', 'reRank', () => `query: ${query.slice(0, 50)}, count: ${results.length}`)

		const contents = results.map(doc => content_map.get(doc.chunk_id) || '')
		const scores = await getRerankScores(query, contents)
		const reranked: Array<RerankedResult> = []

		results.forEach((doc, index) => {
			const rerank_score = scores[index] ?? 0
			const final_score = calculateFinalScore(
				rerank_score,
				doc.normalized_rrf_score,
				doc.rrf_rank,
				false,
				doc.from_keyword
			)

			if (final_score === 0) return

			reranked.push({
				...doc,
				reranker_score: rerank_score,
				final_score,
				content: contents[index]
			})
		})

		log('SEARCH', 'reRank done', () => `result_count: ${reranked.length}`)

		if (reranked.length === 0) {
			const fallback_results = results
				.map((doc, index) => ({
					...doc,
					reranker_score: scores[index] ?? 0,
					final_score: doc.normalized_rrf_score,
					content: contents[index],
					direct_text_match: hasDirectTextMatch(query, contents[index] || '')
				}))
				.filter(item => item.direct_text_match || item.from_keyword)
				.map(({ direct_text_match: _direct_text_match, ...item }) => item)
				.sort((a, b) => b.final_score - a.final_score)

			if (fallback_results.length > 0) return fallback_results
		}

		return reranked.sort((a, b) => b.final_score - a.final_score)
	} finally {
		removeTask('rerank', task_id)
	}
}

const rerankArticle = async (
	query: string,
	results: Array<ArticleSearchResult>,
	for_types?: Array<'linkcase' | 'wiki' | 'memory' | 'user'>
) => {
	if (results.length === 0) return []

	const task_id = addTask('rerank')

	try {
		const article_ids = results.map(item => item.article_id)

		const article_where =
			for_types && for_types.length > 0
				? and(inArray(article.id, article_ids), inArray(article.for, for_types))
				: inArray(article.id, article_ids)

		const articles = await getArticles({
			where: article_where
		})

		const content_map = new Map<string, string>()

		articles.forEach(a => {
			if (a.content) {
				content_map.set(a.id, a.content)
			}
		})

		log('SEARCH', 'reRankArticle', () => `query: ${query.slice(0, 50)}, count: ${results.length}`)

		const contents = results.map(doc => content_map.get(doc.article_id) || '')
		const scores = await getRerankScores(query, contents)
		const reranked: Array<RerankedArticleResult> = []

		results.forEach((doc, index) => {
			const rerank_score = scores[index] ?? 0
			const relevance_score = calculateFinalScore(
				rerank_score,
				doc.normalized_rrf_score,
				doc.rrf_rank,
				true,
				doc.from_keyword
			)

			if (relevance_score === 0) return

			const time_weight = getTimeWeight(doc.updated_at)
			const final_score =
				relevance_score * article_relevance_score_weight + time_weight * article_time_score_weight

			reranked.push({
				...doc,
				reranker_score: rerank_score,
				final_score,
				content: contents[index]
			})
		})

		log('SEARCH', 'reRankArticle done', () => `result_count: ${reranked.length}`)

		if (reranked.length === 0) {
			const fallback_results = results
				.map((doc, index) => {
					const time_weight = getTimeWeight(doc.updated_at)
					const relevance_score = doc.normalized_rrf_score
					const final_score =
						relevance_score * article_relevance_score_weight +
						time_weight * article_time_score_weight

					return {
						...doc,
						reranker_score: scores[index] ?? 0,
						final_score,
						content: contents[index],
						direct_text_match: hasDirectTextMatch(query, contents[index] || '')
					}
				})
				.filter(item => item.direct_text_match || item.from_keyword)
				.map(({ direct_text_match: _direct_text_match, ...item }) => item)
				.sort((a, b) => b.final_score - a.final_score)

			if (fallback_results.length > 0) return fallback_results
		}

		return reranked.sort((a, b) => b.final_score - a.final_score)
	} finally {
		removeTask('rerank', task_id)
	}
}

export default rerankChunk
export { rerankArticle }

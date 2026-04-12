import { article, chunk } from '@core/db/schema'
import { getArticles, getChunks } from '@core/db/services'
import { log } from '@core/utils'
import { inArray } from 'drizzle-orm'

interface ChunkScore {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	final_score: number
	reranker_score: number
	from_keyword?: boolean
}

export interface ArticleWithScore {
	article_id: string
	article_title: string | null
	article_url: string | null
	article_content: string
	chunk_id: string
	content: string
	reranker_score: number
	final_score: number
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	from_keyword?: boolean
}

export default async (chunks: Array<ChunkScore>): Promise<Array<ArticleWithScore>> => {
	if (chunks.length === 0) return []

	const chunk_ids = chunks.map(c => c.chunk_id)

	const chunk_results = await getChunks({
		where: inArray(chunk.id, chunk_ids)
	})

	const article_ids = [...new Set(chunk_results.map(c => c.article_id).filter(Boolean))] as Array<string>

	if (article_ids.length === 0) return []

	const article_results = await getArticles({
		where: inArray(article.id, article_ids)
	})

	const article_map = new Map(article_results.map(a => [a.id, a]))
	const chunk_to_article = new Map(chunk_results.map(c => [c.id, c]))

	const scored_articles: Array<ArticleWithScore> = []
	const seen_articles = new Set<string>()

	for (const c of chunks) {
		const chunk_info = chunk_to_article.get(c.chunk_id)
		if (!chunk_info || !chunk_info.article_id) continue

		const article_info = article_map.get(chunk_info.article_id)
		if (!article_info) continue

		if (seen_articles.has(article_info.id)) continue
		seen_articles.add(article_info.id)

		scored_articles.push({
			article_id: article_info.id,
			article_title: article_info.title,
			article_url: article_info.url,
			article_content: article_info.content,
			chunk_id: c.chunk_id,
			content: chunk_info.content || '',
			reranker_score: c.reranker_score,
			final_score: c.final_score,
			rrf_score: c.rrf_score,
			normalized_rrf_score: c.normalized_rrf_score,
			rrf_rank: c.rrf_rank,
			from_keyword: c.from_keyword
		})
	}

	log('SEARCH', 'lookup', () => `chunk_count: ${chunk_ids.length}, article_count: ${scored_articles.length}`)

	return scored_articles.sort((a, b) => b.final_score - a.final_score)
}

import { chunk } from '@core/db/schema'
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

export interface RerankedResult extends SearchResult {
	reranker_score: number
	final_score: number
}

export default async (query: string, results: Array<SearchResult>) => {
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

		let final_score = 0
		const retrieval_score = doc.normalized_rrf_score

		if (doc.rrf_rank >= 1 && doc.rrf_rank <= 3) {
			final_score = 0.75 * retrieval_score + 0.25 * rerank_score
		} else if (doc.rrf_rank >= 4 && doc.rrf_rank <= 10) {
			final_score = 0.6 * retrieval_score + 0.4 * rerank_score
		} else {
			final_score = 0.4 * retrieval_score + 0.6 * rerank_score
		}

		reranked.push({
			...doc,
			reranker_score: rerank_score,
			final_score
		})
	}

	removeTask('rerank', task_id)

	log('SEARCH', 'reRank done', () => `result_count: ${reranked.length}`)

	return reranked.sort((a, b) => b.final_score - a.final_score)
}

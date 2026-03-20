import getNodeChunk from './getNodeChunk'

interface NodeResult {
	id: string
	name: string
	rowid: number
	similarity: number
}

export default (nodes: Array<NodeResult>, searchType: 'chunk' | 'article') => {
	if (nodes.length === 0) return { chunk_ids: [], article_ids: [] }

	const node_ids = nodes.map(n => n.id)
	const chunk_results = getNodeChunk(node_ids)

	const node_similarity_map = new Map(nodes.map(n => [n.id, n.similarity]))

	const chunk_score_map = new Map<string, { score: number; article_id: string }>()

	chunk_results.forEach(r => {
		const similarity = node_similarity_map.get(r.node_id) || 0
		const existing = chunk_score_map.get(r.chunk_id)
		if (!existing || similarity > existing.score) {
			chunk_score_map.set(r.chunk_id, { score: similarity, article_id: r.article_id })
		}
	})

	const sorted_chunks = Array.from(chunk_score_map.entries())
		.map(([chunk_id, { score, article_id }]) => ({ chunk_id, article_id, score }))
		.sort((a, b) => b.score - a.score)

	const top_chunks = sorted_chunks.slice(0, 50)

	const article_score_map = new Map<string, number>()

	top_chunks.forEach(c => {
		const existing = article_score_map.get(c.article_id) || 0
		article_score_map.set(c.article_id, Math.max(existing, c.score))
	})

	const sorted_articles = Array.from(article_score_map.entries())
		.map(([article_id, score]) => ({ article_id, score }))
		.sort((a, b) => b.score - a.score)

	const top_articles = sorted_articles.slice(0, 10)

	if (searchType === 'chunk') {
		const top_chunk_ids = top_chunks.map(c => c.chunk_id)
		return { chunk_ids: top_chunk_ids, article_ids: top_articles.map(a => a.article_id) }
	}

	return { chunk_ids: [], article_ids: top_articles.map(a => a.article_id) }
}

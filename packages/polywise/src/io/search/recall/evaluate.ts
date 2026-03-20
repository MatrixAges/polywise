import getNodeChunk from './getNodeChunk'

export default (nodes: Array<{ id: string; similarity?: number }>, type: 'chunk' | 'article') => {
	if (nodes.length === 0) return { chunk_ids: [], article_ids: [] }

	const sim_map = new Map(nodes.map(n => [n.id, n.similarity || 0]))
	const chunks = getNodeChunk(nodes.map(n => n.id))

	const chunk_map = new Map<string, { score: number; article_id: string }>()

	chunks.forEach(r => {
		const sim = sim_map.get(r.node_id) || 0
		const e = chunk_map.get(r.chunk_id)
		if (!e || sim > e.score) chunk_map.set(r.chunk_id, { score: sim, article_id: r.article_id })
	})

	const top_chunks = Array.from(chunk_map.entries())
		.map(([chunk_id, { score, article_id }]) => ({ chunk_id, article_id, score }))
		.sort((a, b) => b.score - a.score)
		.slice(0, 50)

	const article_map = new Map<string, number>()

	top_chunks.forEach(c => article_map.set(c.article_id, Math.max(article_map.get(c.article_id) || 0, c.score)))

	const top_articles = Array.from(article_map.entries())
		.map(([article_id, score]) => ({ article_id, score }))
		.sort((a, b) => b.score - a.score)
		.slice(0, 10)

	return type === 'chunk'
		? { chunk_ids: top_chunks.map(c => c.chunk_id), article_ids: top_articles.map(a => a.article_id) }
		: { chunk_ids: [], article_ids: top_articles.map(a => a.article_id) }
}

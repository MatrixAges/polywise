import getNodeChunk from './getNodeChunk'

export default (nodes: Array<{ id: string }>, type: 'chunk' | 'article') => {
	if (nodes.length === 0) return { chunk_ids: [], article_ids: [] }

	const chunks = getNodeChunk(nodes.map(n => n.id))
	const chunk_ids = [...new Set(chunks.map(c => c.chunk_id))]
	const article_ids = [...new Set(chunks.map(c => c.article_id))]

	return type === 'chunk' ? { chunk_ids, article_ids } : { chunk_ids: [], article_ids }
}

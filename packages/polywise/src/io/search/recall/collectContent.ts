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

	const chunk_ids = [...new Set(chunk_results.map(r => r.chunk_id))]
	const article_ids = [...new Set(chunk_results.map(r => r.article_id))]

	if (searchType === 'chunk') {
		return { chunk_ids, article_ids }
	}

	return { chunk_ids: [], article_ids }
}

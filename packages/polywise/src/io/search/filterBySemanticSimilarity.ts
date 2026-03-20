import { getChunkById } from '@core/db/prepare'
import { getEmbedding } from '@core/pipeline'
import getSimilarity from '@core/pipeline/getSimilarity'

interface RrfResult {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
}

const MIN_SEMANTIC_SIMILARITY = 0.55

export default async (query: string, results: Array<RrfResult>) => {
	if (results.length === 0) return []

	const query_embedding = await getEmbedding(query)
	const chunk_ids = results.map(item => item.chunk_id)

	const rows = getChunkById(chunk_ids.length).all(...chunk_ids) as Array<{ chunk_id: string; vectors: Uint8Array }>

	const vector_map = new Map<string, Array<number>>()
	rows.forEach(row => {
		const float_array = new Float32Array(row.vectors.buffer)
		vector_map.set(row.chunk_id, Array.from(float_array))
	})

	const filtered_results = results.filter(item => {
		const chunk_vector = vector_map.get(item.chunk_id)
		if (!chunk_vector) return false
		const similarity = getSimilarity(query_embedding, chunk_vector)
		return similarity >= MIN_SEMANTIC_SIMILARITY
	})

	return filtered_results.map((item, index) => ({
		...item,
		rrf_rank: index + 1
	}))
}

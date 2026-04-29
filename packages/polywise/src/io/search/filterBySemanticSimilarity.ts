import {
	max_boost_factor,
	min_keyword_semantic_similarity,
	min_semantic_similarity,
	recall_min_semantic_similarity,
	relative_similarity_gap,
	semantic_boost_min_anchor_similarity,
	semantic_boost_target
} from '@core/consts/search'
import { getChunkById } from '@core/db/prepare'
import { getEmbedding } from '@core/pipeline'
import getSimilarity from '@core/pipeline/getSimilarity'

interface RrfResult {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	from_recall: boolean
	from_keyword: boolean
}

interface ChunkRow {
	chunk_id: string
	vectors: Uint8Array
}

type SimResult = RrfResult & {
	similarity: number
}

export default async (query: string, results: Array<RrfResult>, recall_chunk_ids: Set<string> = new Set()) => {
	if (results.length === 0) return []

	const query_embedding = await getEmbedding(query)
	const chunk_ids = results.map(item => item.chunk_id)

	const rows = getChunkById(chunk_ids.length).all(...chunk_ids) as Array<ChunkRow>

	const vector_map = new Map<string, Array<number>>(
		rows.map(row => [row.chunk_id, Array.from(new Float32Array(row.vectors.buffer))])
	)

	const sim_results: Array<SimResult> = results.map(item => {
		const chunk_vector = vector_map.get(item.chunk_id)
		const similarity = chunk_vector ? getSimilarity(query_embedding, chunk_vector) : 0

		return { ...item, similarity }
	})

	const max_similarity = sim_results
		.filter(item => !item.from_recall && !recall_chunk_ids.has(item.chunk_id))
		.reduce((max, item) => Math.max(max, item.similarity), 0)

	const boost_factor =
		max_similarity >= semantic_boost_min_anchor_similarity && max_similarity < semantic_boost_target
			? Math.min(max_boost_factor, semantic_boost_target / max_similarity)
			: 1.0

	const relative_threshold = max_similarity > 0 ? Math.max(0, max_similarity - relative_similarity_gap) : 0

	const filtered_results = sim_results.filter(item => {
		const is_recall = item.from_recall || recall_chunk_ids.has(item.chunk_id)
		const weighted_similarity = is_recall ? item.similarity : Math.min(1.0, item.similarity * boost_factor)
		const threshold = is_recall
			? recall_min_semantic_similarity
			: item.from_keyword
				? min_keyword_semantic_similarity
				: min_semantic_similarity
		const pass_relative_threshold = is_recall || item.similarity >= relative_threshold

		return weighted_similarity >= threshold && pass_relative_threshold
	})

	return filtered_results.map((item, index) => ({
		...item,
		rrf_rank: index + 1
	}))
}

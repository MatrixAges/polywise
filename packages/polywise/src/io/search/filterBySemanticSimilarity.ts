import { getChunkById } from '@core/db/prepare'
import { getEmbedding } from '@core/pipeline'
import getSimilarity from '@core/pipeline/getSimilarity'

interface RrfResult {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	from_recall: boolean
}

const MIN_SEMANTIC_SIMILARITY = 0.55
const RECALL_MIN_SIMILARITY = 0.15

export default async (query: string, results: Array<RrfResult>, recallChunkIds: Set<string> = new Set()) => {
	if (results.length === 0) return []

	const query_embedding = await getEmbedding(query)
	const chunk_ids = results.map(item => item.chunk_id)

	const rows = getChunkById(chunk_ids.length).all(...chunk_ids) as Array<{ chunk_id: string; vectors: Uint8Array }>

	const vector_map = new Map<string, Array<number>>()
	rows.forEach(row => {
		const float_array = new Float32Array(row.vectors.buffer)
		vector_map.set(row.chunk_id, Array.from(float_array))
	})

	const sim_results = results.map(item => {
		const chunk_vector = vector_map.get(item.chunk_id)
		const similarity = chunk_vector ? getSimilarity(query_embedding, chunk_vector) : 0
		return { ...item, similarity }
	})

	// 计算出不包含 Recall 来源的正常搜索结果中的最高相似度
	const max_similarity = sim_results
		.filter(item => !item.from_recall && !recallChunkIds.has(item.chunk_id))
		.reduce((max, item) => Math.max(max, item.similarity), 0)

	// 计算加权系数：如果最高分很低，我们通过加权系数将其拉近到 0.85 的水平
	// 如果最高分已经超过 0.85，就不做任何加权 (系数为 1.0)
	// 同时，为了防止极低分数被无限放大，限定 max_similarity 至少为 0.3
	let boost_factor = 1.0
	if (max_similarity > 0 && max_similarity < 0.85) {
		const effective_max = Math.max(0.3, max_similarity)
		boost_factor = 0.85 / effective_max
	}

	const filtered_results = sim_results.filter(item => {
		// 对非 Recall 的相似度进行加权提升
		const weighted_similarity =
			!item.from_recall && !recallChunkIds.has(item.chunk_id)
				? Math.min(1.0, item.similarity * boost_factor)
				: item.similarity // Recall 来源自带极低容忍度(0.15)，不加权

		const threshold =
			item.from_recall || recallChunkIds.has(item.chunk_id)
				? RECALL_MIN_SIMILARITY
				: MIN_SEMANTIC_SIMILARITY

		console.log(
			`[filter] ID:${item.chunk_id} RawSim:${item.similarity.toFixed(3)} WeightedSim:${weighted_similarity.toFixed(3)} Boost:${boost_factor.toFixed(2)} Threshold:${threshold.toFixed(3)} Recall:${item.from_recall} MaxSim:${max_similarity.toFixed(3)}`
		)

		// 判断是否能够通过固定过滤线
		return weighted_similarity >= threshold
	})

	return filtered_results.map((item, index) => ({
		...item,
		rrf_rank: index + 1
	}))
}

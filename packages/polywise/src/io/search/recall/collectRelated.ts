import { getEdgeByNodeId, getNodeById } from '@core/db/prepare'
import { scoreEdgeStrength } from '@core/rewire/constants'

const related_similarity_base = 0.5

export default (nodes: Array<{ id: string }>, depth: number = 2) => {
	if (nodes.length === 0 || depth < 1) return []
	const ids = nodes.map(n => n.id)

	const getRelated = (arr: string[]) => {
		if (arr.length === 0) return []
		const edges = getEdgeByNodeId(arr.length).all(...arr, ...arr) as Array<{
			source_id: string
			target_id: string
			weight: number | null
			confidence: number | null
			bandwidth: number | null
		}>

		return edges
	}

	const visited = new Set(ids)
	const depth_map = new Map<string, number>()
	const similarity_map = new Map<string, number>()
	let frontier = new Map(ids.map(id => [id, 1]))

	for (let level = 1; level <= depth; level += 1) {
		const discovered = getRelated([...frontier.keys()])
		const next_frontier = new Map<string, number>()

		discovered.forEach(edge => {
			const source_score = frontier.get(edge.source_id)
			const target_score = frontier.get(edge.target_id)
			const edge_score = Math.max(0.1, scoreEdgeStrength(edge))

			if (source_score && !visited.has(edge.target_id)) {
				const similarity = (related_similarity_base * source_score * edge_score) / level
				const prev = next_frontier.get(edge.target_id) ?? 0

				if (similarity > prev) {
					next_frontier.set(edge.target_id, similarity)
				}
			}

			if (target_score && !visited.has(edge.source_id)) {
				const similarity = (related_similarity_base * target_score * edge_score) / level
				const prev = next_frontier.get(edge.source_id) ?? 0

				if (similarity > prev) {
					next_frontier.set(edge.source_id, similarity)
				}
			}
		})

		if (next_frontier.size === 0) break

		for (const [id, similarity] of next_frontier) {
			visited.add(id)
			depth_map.set(id, level)
			similarity_map.set(id, similarity)
		}

		frontier = next_frontier
	}

	const all = Array.from(depth_map.keys())

	if (all.length === 0) return []

	const results = getNodeById(all.length).all(...all) as Array<{ id: string; name: string; rowid: number }>

	return results.map(n => ({
		...n,
		similarity: similarity_map.get(n.id) || related_similarity_base / (depth_map.get(n.id) || 1)
	}))
}

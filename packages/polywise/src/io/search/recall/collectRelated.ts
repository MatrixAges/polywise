import { getEdgeByNodeId, getNodeById } from '@core/db/prepare'

const related_similarity_base = 0.5

export default (nodes: Array<{ id: string }>, depth: number = 2) => {
	if (nodes.length === 0 || depth < 1) return []
	const ids = nodes.map(n => n.id)

	const getRelated = (arr: string[]) => {
		if (arr.length === 0) return []
		const edges = getEdgeByNodeId(arr.length).all(...arr, ...arr) as Array<{
			source_id: string
			target_id: string
		}>

		return [...new Set(edges.flatMap(e => [e.source_id, e.target_id]))]
	}

	const visited = new Set(ids)
	const depth_map = new Map<string, number>()
	let frontier = ids

	for (let level = 1; level <= depth; level += 1) {
		const discovered = getRelated(frontier)
		const next_frontier: Array<string> = []

		discovered.forEach(id => {
			if (visited.has(id)) return

			visited.add(id)
			depth_map.set(id, level)
			next_frontier.push(id)
		})

		if (next_frontier.length === 0) break

		frontier = next_frontier
	}

	const all = Array.from(depth_map.keys())

	if (all.length === 0) return []

	const results = getNodeById(all.length).all(...all) as Array<{ id: string; name: string; rowid: number }>

	return results.map(n => ({
		...n,
		similarity: related_similarity_base / (depth_map.get(n.id) || 1)
	}))
}

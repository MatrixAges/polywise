import { getEdgeByNodeId, getNodeById } from '@core/db/prepare'

export default (nodes: Array<{ id: string }>) => {
	if (nodes.length === 0) return []
	const ids = nodes.map(n => n.id)

	const getRelated = (arr: string[]) => {
		if (arr.length === 0) return []

		const edges = getEdgeByNodeId(arr.length).all(...arr, ...arr) as Array<{
			source_id: string
			target_id: string
		}>

		return [...new Set(edges.flatMap(e => [e.source_id, e.target_id]))]
	}

	const r1 = getRelated(ids)
	const r2 = getRelated(r1)
	const all = [...new Set([...ids, ...r1, ...r2])]

	if (all.length === 0) return []

	const results = getNodeById(all.length).all(...all) as Array<{ id: string; name: string; rowid: number }>

	return results.map(n => ({ ...n, similarity: 0.5 }))
}

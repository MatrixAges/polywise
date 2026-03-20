import { env } from '@core/env'

interface NodeResult {
	id: string
	name: string
	rowid: number
	similarity: number
}

export default async (nodes: Array<NodeResult>) => {
	if (nodes.length === 0) return []

	const first_round_node_ids: string[] = []
	const first_round_edge_ids: string[] = []
	const first_round_related_node_ids: Set<string> = new Set()

	const placeholders = nodes.map(() => '?').join(',')
	const node_ids = nodes.map(n => n.id)

	const edge_query = `
		SELECT e.id, e.source_id, e.target_id
		FROM edge e
		WHERE e.source_id IN (${placeholders}) OR e.target_id IN (${placeholders})
	`

	const edge_stmt = env.sqlite.prepare(edge_query)
	const edges = edge_stmt.all(...node_ids) as Array<{ id: string; source_id: string; target_id: string }>

	edges.forEach(e => {
		first_round_edge_ids.push(e.id)
		first_round_related_node_ids.add(e.source_id)
		first_round_related_node_ids.add(e.target_id)
	})

	first_round_node_ids.push(...node_ids)

	const unique_first_round_nodes = [...new Set([...first_round_node_ids, ...first_round_related_node_ids])]

	const second_round_edge_query = `
		SELECT e.id, e.source_id, e.target_id
		FROM edge e
		WHERE e.source_id IN (${unique_first_round_nodes.map(() => '?').join(',')}) OR e.target_id IN (${unique_first_round_nodes.map(() => '?').join(',')})
	`

	const second_round_edge_stmt = env.sqlite.prepare(second_round_edge_query)
	const second_round_edges = second_round_edge_stmt.all(
		...unique_first_round_nodes,
		...unique_first_round_nodes
	) as Array<{ id: string; source_id: string; target_id: string }>

	const second_round_related_node_ids: Set<string> = new Set()

	second_round_edges.forEach(e => {
		second_round_related_node_ids.add(e.source_id)
		second_round_related_node_ids.add(e.target_id)
	})

	const all_related_node_ids = [...new Set([...first_round_related_node_ids, ...second_round_related_node_ids])]

	if (all_related_node_ids.length === 0) return []

	const node_query = `
		SELECT id, name, rowid
		FROM node
		WHERE id IN (${all_related_node_ids.map(() => '?').join(',')})
	`

	const node_stmt = env.sqlite.prepare(node_query)
	const related_nodes = node_stmt.all(...all_related_node_ids) as Array<{ id: string; name: string; rowid: number }>

	return related_nodes.map(n => ({
		id: n.id,
		name: n.name,
		rowid: n.rowid,
		similarity: 0.5
	}))
}

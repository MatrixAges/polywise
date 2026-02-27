import { system } from '../consts'

import type { Edge, Node } from '../types'

interface Args {
	matched_nodes: Array<Node>
	related_nodes: Array<Node>
	edges: Array<Edge>
}

export default (args: Args) => {
	const { matched_nodes, related_nodes, edges } = args
	const node_map = new Map<string, Node>()

	for (const node of matched_nodes) {
		node_map.set(node.id, node)
	}

	for (const node of related_nodes) {
		node_map.set(node.id, node)
	}

	const neighbor_map = new Map<string, Array<string>>()

	for (const edge of edges) {
		if (edge.weight < system.local_competition_edge_weight_min) continue

		const source_neighbors = neighbor_map.get(edge.source_id!) ?? []
		const target_neighbors = neighbor_map.get(edge.target_id!) ?? []

		source_neighbors.push(edge.target_id!)
		target_neighbors.push(edge.source_id!)

		neighbor_map.set(edge.source_id!, source_neighbors)
		neighbor_map.set(edge.target_id!, target_neighbors)
	}

	const inhibited_ids = new Set<string>()

	for (const node of related_nodes) {
		const neighbors = neighbor_map.get(node.id) ?? []

		let max_neighbor_potential = 0

		for (const neighbor_id of neighbors) {
			const neighbor = node_map.get(neighbor_id)
			const neighbor_potential = neighbor?.potential ?? 0

			if (neighbor_potential > max_neighbor_potential) {
				max_neighbor_potential = neighbor_potential
			}
		}

		const node_potential = node.potential ?? 0

		if (
			max_neighbor_potential > 0 &&
			node_potential < max_neighbor_potential * system.local_competition_ratio
		) {
			inhibited_ids.add(node.id)
		}
	}

	const matched_ids = new Set(matched_nodes.map(node => node.id))

	const selected_nodes = Array.from(node_map.values()).filter(
		node => matched_ids.has(node.id) || !inhibited_ids.has(node.id)
	)

	const filtered_related_nodes = selected_nodes.filter(node => !matched_ids.has(node.id))

	return { selected_nodes, filtered_related_nodes }
}

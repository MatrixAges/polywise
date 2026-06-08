import type { AgentGraphEdge, AgentGraphNode } from '../../types'

export interface GraphLayoutNode extends AgentGraphNode {
	x?: number
	y?: number
	vx?: number
	vy?: number
	radius: number
}

export interface GraphLayoutEdge extends AgentGraphEdge {
	source: string | GraphLayoutNode
	target: string | GraphLayoutNode
}

const getNodeWeight = (node_item: AgentGraphNode) => {
	return (
		node_item.active_times * 0.45 +
		node_item.degree * 2.8 +
		node_item.article_count * 3.5 +
		node_item.chunk_count * 1.8
	)
}

export const getNodeRadius = (node_item: AgentGraphNode) => {
	const weighted_size = Math.sqrt(getNodeWeight(node_item) + 1) * 3.2

	return Math.max(16, Math.min(34, weighted_size))
}

export const getNodeColor = (node_item: AgentGraphNode, selected_node_id: string) => {
	if (node_item.id === selected_node_id) {
		return '#f97316'
	}

	if (node_item.is_frozen) {
		return '#0f766e'
	}

	if (node_item.article_count > 0) {
		return '#2563eb'
	}

	return '#475569'
}

export const getEdgeColor = (edge_item: AgentGraphEdge) => {
	if (edge_item.state !== 'active') {
		return '#94a3b8'
	}

	if (edge_item.is_frozen) {
		return '#14b8a6'
	}

	return '#64748b'
}

export const getEdgeOpacity = (edge_item: AgentGraphEdge) => {
	return Math.max(0.18, Math.min(0.72, 0.18 + edge_item.confidence * 0.45 + edge_item.article_count * 0.04))
}

export const getEdgeWidth = (edge_item: AgentGraphEdge) => {
	return Math.max(1.2, Math.min(4.6, 1 + edge_item.weight * 0.9 + edge_item.article_count * 0.2))
}

export const getLinkDistance = (edge_item: AgentGraphEdge) => {
	return Math.max(70, Math.min(170, 152 - edge_item.weight * 14 - edge_item.confidence * 18))
}

export const getChargeStrength = (node_count: number) => {
	return Math.max(-540, -160 - node_count * 12)
}

export const getInitialNodePoint = (args: {
	index: number
	total: number
	boundary_radius: number
	center_x: number
	center_y: number
}) => {
	const { index, total, boundary_radius, center_x, center_y } = args
	const golden_angle = Math.PI * (3 - Math.sqrt(5))
	const angle = index * golden_angle
	const normalized_step = total <= 1 ? 0 : index / (total - 1)
	const distance = boundary_radius * (0.18 + normalized_step * 0.55)

	return {
		x: center_x + Math.cos(angle) * distance,
		y: center_y + Math.sin(angle) * distance
	}
}

export const clampNodePosition = (args: {
	layout_node: GraphLayoutNode
	center_x: number
	center_y: number
	boundary_radius: number
}) => {
	const { layout_node, center_x, center_y, boundary_radius } = args
	const next_x = layout_node.x ?? center_x
	const next_y = layout_node.y ?? center_y
	const delta_x = next_x - center_x
	const delta_y = next_y - center_y
	const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y)
	const limit = boundary_radius - layout_node.radius - 8

	if (distance <= limit || distance === 0) {
		layout_node.x = next_x
		layout_node.y = next_y

		return
	}

	const scale = limit / distance

	layout_node.x = center_x + delta_x * scale
	layout_node.y = center_y + delta_y * scale
	layout_node.vx = (layout_node.vx ?? 0) * 0.4
	layout_node.vy = (layout_node.vy ?? 0) * 0.4
}

export const getLinkNode = (value: string | GraphLayoutNode, node_map: Map<string, GraphLayoutNode>) => {
	if (typeof value === 'string') {
		return node_map.get(value) ?? null
	}

	return value
}

export const getNodeLabel = (name: string) => {
	return name.length > 16 ? `${name.slice(0, 15)}…` : name
}

export const getPreviewText = (value: string, size = 120) => {
	const compact_value = value.replace(/\s+/g, ' ').trim()

	if (compact_value.length <= size) {
		return compact_value
	}

	return `${compact_value.slice(0, size - 1)}…`
}

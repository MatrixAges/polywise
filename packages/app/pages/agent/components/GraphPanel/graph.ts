import type { AgentGraphEdge, AgentGraphNode } from '../../types'

export interface GraphLayoutNode extends AgentGraphNode {
	x?: number
	y?: number
	vx?: number
	vy?: number
	radius: number
	label_width: number
	label_height: number
	collision_radius: number
	anchor_x: number
	anchor_y: number
	anchor_radius: number
	boundary_radius: number
}

export interface GraphLayoutEdge extends AgentGraphEdge {
	source: string | GraphLayoutNode
	target: string | GraphLayoutNode
}

export interface GraphViewport {
	x: number
	y: number
	scale: number
}

const getCompactNodeName = (name: string) => {
	const compact_name = name.trim()

	if (compact_name.length <= 24) {
		return compact_name
	}

	return `${compact_name.slice(0, 23)}…`
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
	const weighted_size = Math.sqrt(getNodeWeight(node_item) + 1) * 2.1

	return Math.max(10, Math.min(22, weighted_size))
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
	return Math.max(0.14, Math.min(0.38, 0.12 + edge_item.confidence * 0.22 + edge_item.article_count * 0.02))
}

export const getEdgeWidth = (edge_item: AgentGraphEdge) => {
	return Math.max(1, Math.min(2.6, 0.9 + edge_item.weight * 0.42 + edge_item.article_count * 0.08))
}

export const getLinkDistance = (edge_item: AgentGraphEdge) => {
	return Math.max(140, Math.min(240, 208 - edge_item.weight * 12 - edge_item.confidence * 16))
}

export const getChargeStrength = (node_count: number) => {
	return Math.max(-1280, -360 - node_count * 22)
}

export const getGraphBoundaryRadius = (args: {
	node_count: number
	width: number
	height: number
	padding: number
}) => {
	const { node_count, width, height, padding } = args
	const base_radius = Math.max(150, Math.min(width, height) / 2 - padding - 84)
	const growth_radius = Math.max(0, Math.sqrt(Math.max(node_count - 18, 0)) * 28)

	return base_radius + growth_radius
}

export const getInitialNodePoint = (args: {
	index: number
	total: number
	center_x: number
	center_y: number
	boundary_radius: number
}) => {
	const { index, total, center_x, center_y, boundary_radius } = args
	const golden_angle = Math.PI * (3 - Math.sqrt(5))
	const angle = index * golden_angle
	const normalized_step = total <= 1 ? 0.5 : (index + 0.5) / total
	const distance_scale = Math.sqrt(normalized_step) * 0.96
	const distance = boundary_radius * distance_scale

	return {
		x: center_x + Math.cos(angle) * distance,
		y: center_y + Math.sin(angle) * distance,
		radius: distance
	}
}

export const clampNodePosition = (args: { layout_node: GraphLayoutNode; width: number; height: number }) => {
	const { layout_node, width, height } = args
	const center_x = width / 2
	const center_y = height / 2
	const next_x = layout_node.x ?? width / 2
	const next_y = layout_node.y ?? height / 2
	const boundary_radius = Math.max(
		96,
		layout_node.boundary_radius - Math.max(layout_node.collision_radius * 0.62, layout_node.radius + 24)
	)
	const delta_x = next_x - center_x
	const delta_y = next_y - center_y
	const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y)

	if (distance <= boundary_radius || distance === 0) {
		layout_node.x = next_x
		layout_node.y = next_y

		return
	}

	const scale = boundary_radius / distance
	const clamped_x = center_x + delta_x * scale
	const clamped_y = center_y + delta_y * scale

	layout_node.x = clamped_x
	layout_node.y = clamped_y
	layout_node.vx = (layout_node.vx ?? 0) * 0.35
	layout_node.vy = (layout_node.vy ?? 0) * 0.35
}

export const getLinkNode = (value: string | GraphLayoutNode, node_map: Map<string, GraphLayoutNode>) => {
	if (typeof value === 'string') {
		return node_map.get(value) ?? null
	}

	return value
}

export const getDefaultViewport = () =>
	({
		x: 0,
		y: 0,
		scale: 1
	}) satisfies GraphViewport

export const getEdgeLabel = (edge_item: AgentGraphEdge, args?: { source_name?: string; target_name?: string }) => {
	if (edge_item.relation.trim()) {
		return edge_item.relation.trim()
	}

	if (args?.source_name && args?.target_name) {
		return `${args.source_name} -> ${args.target_name}`
	}

	return 'Untitled edge'
}

export const getNodeLabelLines = (name: string) => {
	const compact_name = getCompactNodeName(name)

	if (compact_name.length <= 12) {
		return [compact_name]
	}

	return [compact_name.slice(0, 12), compact_name.slice(12, 24)]
}

export const getNodeLabelWidth = (label_lines: Array<string>) => {
	const max_line_length = label_lines.reduce(
		(longest_size, line_item) => Math.max(longest_size, line_item.length),
		0
	)

	return Math.max(58, Math.min(132, max_line_length * 7.2 + 18))
}

export const getNodeLabelHeight = (label_lines: Array<string>) => {
	return label_lines.length > 1 ? 30 : 22
}

export const getNodeCollisionRadius = (args: { radius: number; label_width: number; label_height: number }) => {
	const { radius, label_width, label_height } = args

	return Math.max(radius + 26, label_width * 0.54, radius + label_height + 18)
}

export const getPreviewText = (value: string, size = 120) => {
	const compact_value = value.replace(/\s+/g, ' ').trim()

	if (compact_value.length <= size) {
		return compact_value
	}

	return `${compact_value.slice(0, size - 1)}…`
}

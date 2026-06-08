import { useEffect, useRef, useState } from 'react'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation } from 'd3-force'

import { clampNodePosition, getChargeStrength, getInitialNodePoint, getLinkDistance, getNodeRadius } from './graph'

import type { AgentGraphEdge, AgentGraphNode } from '../../types'
import type { GraphLayoutEdge, GraphLayoutNode } from './graph'

interface IArgs {
	nodes: Array<AgentGraphNode>
	edges: Array<AgentGraphEdge>
	width: number
	height: number
}

const useGraphSimulation = (args: IArgs) => {
	const { nodes, edges, width, height } = args
	const [layout_nodes, setLayoutNodes] = useState([] as Array<GraphLayoutNode>)
	const [layout_edges, setLayoutEdges] = useState([] as Array<GraphLayoutEdge>)
	const ref_position_map = useRef({} as Record<string, { x: number; y: number }>)

	useEffect(() => {
		const boundary_size = Math.min(width, height)

		if (boundary_size <= 0 || nodes.length === 0) {
			setLayoutNodes([])
			setLayoutEdges([])

			return
		}

		const boundary_radius = boundary_size / 2
		const center_x = boundary_radius
		const center_y = boundary_radius
		const next_layout_nodes = nodes.map((node_item, index) => {
			const cached_position = ref_position_map.current[node_item.id]
			const fallback_position = getInitialNodePoint({
				index,
				total: nodes.length,
				boundary_radius,
				center_x,
				center_y
			})

			return {
				...node_item,
				x: cached_position?.x ?? fallback_position.x,
				y: cached_position?.y ?? fallback_position.y,
				radius: getNodeRadius(node_item)
			}
		})
		const next_layout_edges = edges.map(edge_item => ({
			...edge_item,
			source: edge_item.source_id,
			target: edge_item.target_id
		}))
		let frame_id = 0
		const syncGraph = () => {
			cancelAnimationFrame(frame_id)
			frame_id = requestAnimationFrame(() => {
				next_layout_nodes.forEach(layout_node => {
					clampNodePosition({
						layout_node,
						center_x,
						center_y,
						boundary_radius
					})
					ref_position_map.current[layout_node.id] = {
						x: layout_node.x ?? center_x,
						y: layout_node.y ?? center_y
					}
				})

				setLayoutNodes([...next_layout_nodes])
				setLayoutEdges([...next_layout_edges])
			})
		}
		const simulation = forceSimulation(next_layout_nodes)
			.force('center', forceCenter(center_x, center_y))
			.force('charge', forceManyBody().strength(getChargeStrength(nodes.length)))
			.force(
				'collision',
				forceCollide<GraphLayoutNode>()
					.radius(layout_node => layout_node.radius + 6)
					.strength(0.92)
			)
			.force(
				'link',
				forceLink<GraphLayoutNode, GraphLayoutEdge>(next_layout_edges)
					.id(layout_node => layout_node.id)
					.distance(layout_edge => getLinkDistance(layout_edge))
					.strength(0.26)
			)
			.force('radial', forceRadial(boundary_radius * 0.58, center_x, center_y).strength(0.08))
			.alpha(0.9)
			.alphaDecay(0.045)
			.velocityDecay(0.3)
			.on('tick', syncGraph)

		syncGraph()

		return () => {
			cancelAnimationFrame(frame_id)
			simulation.stop()
		}
	}, [edges, height, nodes, width])

	return {
		layout_nodes,
		layout_edges
	}
}

export default useGraphSimulation

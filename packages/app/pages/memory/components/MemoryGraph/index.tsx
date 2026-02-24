import { useRef, useCallback, useEffect, useMemo } from 'react'
import { Background, ReactFlow, useEdgesState, useNodesState, BackgroundVariant } from '@xyflow/react'
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter, forceX, forceY } from 'd3-force'
import { Spin } from 'antd'
import '@xyflow/react/dist/style.css'

import { memo } from '@/utils'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'

import type { Node, Edge, NodeChange } from '@xyflow/react'

interface MemoryGraphProps {
	nodes: Array<{
		id: string
		label: string
		x: number
		y: number
		activation: number
		potential: number
	}>
	edges: Array<{
		source_id: string
		target_id: string
		weight: number
		distance: number
	}>
	loading?: boolean
	onNodeClick?: (node_id: string) => void
}

const nodeTypes = {
	customNode: CustomNode
}

const edgeTypes = {
	customEdge: CustomEdge
}

const colorMegaPools = [
	// Sunset
	['#f43f5e', '#e11d48', '#f87171', '#ef4444', '#dc2626', '#fb923c', '#f97316', '#ea580c'],
	// Forest
	[
		'#f59e0b',
		'#d97706',
		'#a3e635',
		'#84cc16',
		'#65a30d',
		'#4ade80',
		'#22c55e',
		'#16a34a',
		'#34d399',
		'#10b981',
		'#059669'
	],
	// Ocean
	[
		'#2dd4bf',
		'#14b8a6',
		'#0d9488',
		'#22d3ee',
		'#06b6d4',
		'#0891b2',
		'#38bdf8',
		'#0ea5e9',
		'#0284c7',
		'#60a5fa',
		'#3b82f6',
		'#2563eb'
	],
	// Midnight
	[
		'#818cf8',
		'#6366f1',
		'#4f46e5',
		'#a78bfa',
		'#8b5cf6',
		'#7c3aed',
		'#c084fc',
		'#a855f7',
		'#9333ea',
		'#e879f9',
		'#d946ef',
		'#c026d3'
	]
]

const MemoryGraph = (props: MemoryGraphProps) => {
	const { nodes: initialNodes, edges: initialEdges, loading = false, onNodeClick } = props

	const [flow_nodes, setNodes, onOriginalNodesChange] = useNodesState<Node>([])
	const [flow_edges, setEdges, onOriginalEdgesChange] = useEdgesState<Edge>([])
	const simRef = useRef<any>(null)
	const draggingNodeIdRef = useRef<string | null>(null)

	console.log(flow_nodes)

	const onNodesChange = useCallback(
		(changes: Array<NodeChange>) => {
			onOriginalNodesChange(changes)
		},
		[onOriginalNodesChange]
	)

	const onEdgesChange = useCallback(
		(changes: any) => {
			onOriginalEdgesChange(changes)
		},
		[onOriginalEdgesChange]
	)

	const onNodeDragStart = useCallback((evt: any, node: Node) => {
		draggingNodeIdRef.current = node.id
		if (simRef.current) {
			const simNode = simRef.current.nodes().find((n: any) => n.id === node.id)
			if (simNode) {
				simNode.fx = simNode.x
				simNode.fy = simNode.y
			}
			simRef.current.alphaTarget(0.3).restart()
		}
	}, [])

	const onNodeDrag = useCallback((evt: any, node: Node) => {
		if (simRef.current) {
			const simNode = simRef.current.nodes().find((n: any) => n.id === node.id)
			if (simNode) {
				// Important: Sync React Flow's drag position back to D3
				simNode.fx = node.position.x + 130
				simNode.fy = node.position.y + 42
			}
		}
	}, [])

	const onNodeDragStop = useCallback((evt: any, node: Node) => {
		draggingNodeIdRef.current = null
		if (simRef.current) {
			const simNode = simRef.current.nodes().find((n: any) => n.id === node.id)
			if (simNode) {
				simNode.fx = null
				simNode.fy = null
			}
			simRef.current.alphaTarget(0)
		}
	}, [])

	const graphData = useMemo(() => {
		const nodes = initialNodes.map(n => ({ ...n }))
		const links = initialEdges.map(e => ({ ...e, source: e.source_id, target: e.target_id }))

		const adj = new Map<string, string[]>()
		nodes.forEach(n => adj.set(n.id, []))
		links.forEach(l => {
			if (adj.has(l.source as string) && adj.has(l.target as string)) {
				adj.get(l.source as string)!.push(l.target as string)
				adj.get(l.target as string)!.push(l.source as string)
			}
		})

		const visited = new Set<string>()
		const clusters: string[][] = []

		nodes.forEach(n => {
			if (!visited.has(n.id)) {
				const cluster: string[] = []
				const queue = [n.id]
				visited.add(n.id)

				while (queue.length > 0) {
					const curr = queue.shift()!
					cluster.push(curr)
					adj.get(curr)?.forEach(neighbor => {
						if (!visited.has(neighbor)) {
							visited.add(neighbor)
							queue.push(neighbor)
						}
					})
				}
				clusters.push(cluster)
			}
		})

		const nodeColorMap = new Map<string, string>()
		clusters.forEach((cluster, idx) => {
			const poolIndex = idx % colorMegaPools.length
			const pool = [...colorMegaPools[poolIndex]]

			for (let i = pool.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				const temp = pool[i]
				pool[i] = pool[j]
				pool[j] = temp
			}

			cluster.forEach((nodeId, nodeIdx) => {
				const color = pool[nodeIdx % pool.length]
				nodeColorMap.set(nodeId, color)
			})
		})

		nodes.forEach(n => {
			;(n as any).clusterColor = nodeColorMap.get(n.id) || '#cbd5e1'
			;(n as any).clusterIdx = clusters.findIndex(c => c.includes(n.id))
		})

		return { nodes, links, clusters }
	}, [initialNodes, initialEdges])

	useEffect(() => {
		if (graphData.nodes.length === 0) return

		const getClusterTarget = (clusterIdx: number, totalClusters: number) => {
			if (totalClusters <= 1) return { x: 0, y: 0 }
			// Massively reduced radius for initial focal points
			const radius = 50 + clusterIdx * 20
			const angle = (clusterIdx / totalClusters) * 2 * Math.PI
			return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
		}

		const simNodes = graphData.nodes.map(d => {
			const existingNode = flow_nodes.find(fn => fn.id === d.id)
			if (existingNode) {
				return {
					...d,
					x: existingNode.position.x + 130,
					y: existingNode.position.y + 42
				}
			}
			const target = getClusterTarget((d as any).clusterIdx, graphData.clusters.length)
			return {
				...d,
				x: target.x + (Math.random() - 0.5) * 300,
				y: target.y + (Math.random() - 0.5) * 300
			}
		})
		const simLinks = graphData.links.map(d => ({
			...d,
			source: d.source,
			target: d.target
		}))

		const sim = forceSimulation(simNodes as any)
			.force('center', forceCenter(0, 0).strength(0.05)) // Relaxed pull
			.force('x', forceX(0).strength(0.05))
			.force('y', forceY(0).strength(0.05))
			.force('charge', forceManyBody().strength(-800).distanceMax(800)) // Scaled back repulsion
			.force(
				'collide',
				forceCollide((node: any) => {
					return 200 // Increased collision buffer by 50 (extra 100 space between nodes)
				}).iterations(5)
			)
			.force(
				'link',
				forceLink(simLinks as any)
					.id((d: any) => d.id)
					.distance((link: any) => {
						return 30 + (link.distance || 0) * 30
					})
					.strength(1)
			)

		const getOptimalHandles = (edge: any) => {
			// Get actual node objects from simulation
			const nodeA =
				typeof edge.source === 'string'
					? sim.nodes().find((n: any) => n.id === edge.source)
					: edge.source
			const nodeB =
				typeof edge.target === 'string'
					? sim.nodes().find((n: any) => n.id === edge.target)
					: edge.target

			if (!nodeA || !nodeB) return { sourceHandle: 'right-source', targetHandle: 'left-target' }

			const W = 260
			const H = 84
			const handlesA = [
				{ id: 'top', x: nodeA.x, y: nodeA.y - H / 2 },
				{ id: 'bottom', x: nodeA.x, y: nodeA.y + H / 2 },
				{ id: 'left', x: nodeA.x - W / 2, y: nodeA.y },
				{ id: 'right', x: nodeA.x + W / 2, y: nodeA.y }
			]
			const handlesB = [
				{ id: 'top', x: nodeB.x, y: nodeB.y - H / 2 },
				{ id: 'bottom', x: nodeB.x, y: nodeB.y + H / 2 },
				{ id: 'left', x: nodeB.x - W / 2, y: nodeB.y },
				{ id: 'right', x: nodeB.x + W / 2, y: nodeB.y }
			]

			let minDist = Infinity
			let bestA = 'right'
			let bestB = 'left'

			const currentA = edge._prevSourceHandleId
			const currentB = edge._prevTargetHandleId

			let currentDist = Infinity
			if (currentA && currentB) {
				const currHandleA = handlesA.find(h => h.id === currentA)
				const currHandleB = handlesB.find(h => h.id === currentB)
				if (currHandleA && currHandleB) {
					currentDist = Math.sqrt(
						Math.pow(currHandleA.x - currHandleB.x, 2) +
							Math.pow(currHandleA.y - currHandleB.y, 2)
					)
				}
			}

			for (const a of handlesA) {
				for (const b of handlesB) {
					const dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
					if (dist < minDist) {
						minDist = dist
						bestA = a.id
						bestB = b.id
					}
				}
			}

			if (currentDist !== Infinity && minDist > currentDist - 10) {
				bestA = currentA
				bestB = currentB
			} else {
				edge._prevSourceHandleId = bestA
				edge._prevTargetHandleId = bestB
			}

			return { sourceHandle: bestA + '-source', targetHandle: bestB + '-target' }
		}

		// Initial seed of nodes so the tick function has nds to map over
		const initialFlowNodes = simNodes.map((node: any) => ({
			id: node.id,
			position: { x: node.x - 130, y: node.y - 42 },
			data: {
				label: node.label,
				potential: node.potential,
				activation: node.activation ?? node.potential,
				clusterColor: node.clusterColor
			},
			type: 'customNode'
		}))
		setNodes(initialFlowNodes)

		const initialFlowEdges = simLinks.map((edge: any) => {
			const handles = getOptimalHandles({
				...edge,
				source: simNodes.find(n => n.id === edge.source),
				target: simNodes.find(n => n.id === edge.target)
			})
			return {
				id: `${edge.source}_${edge.target}`,
				source: edge.source,
				target: edge.target,
				sourceHandle: handles.sourceHandle,
				targetHandle: handles.targetHandle,
				animated: edge.weight > 1,
				type: 'customEdge',
				data: {
					weight: edge.weight,
					distance: edge.distance
				}
			}
		})
		setEdges(initialFlowEdges)

		sim.on('tick', () => {
			requestAnimationFrame(() => {
				setNodes(nds =>
					nds.map((node: any) => {
						if (node.id === draggingNodeIdRef.current) return node

						const simNode = sim.nodes().find((n: any) => n.id === node.id)
						if (!simNode) return node

						return {
							...node,
							position: { x: (simNode.x || 0) - 130, y: (simNode.y || 0) - 42 }
						}
					})
				)

				setEdges(
					simLinks.map((edge: any) => {
						const handles = getOptimalHandles(edge)
						return {
							id: `${typeof edge.source === 'string' ? edge.source : edge.source.id}_${typeof edge.target === 'string' ? edge.target : edge.target.id}`,
							source: typeof edge.source === 'string' ? edge.source : edge.source.id,
							target: typeof edge.target === 'string' ? edge.target : edge.target.id,
							sourceHandle: handles.sourceHandle,
							targetHandle: handles.targetHandle,
							animated: edge.weight > 1,
							type: 'customEdge',
							data: {
								weight: edge.weight,
								distance: edge.distance
							}
						}
					})
				)
			})
		})

		simRef.current = sim

		return () => {
			sim.stop()
		}
	}, [graphData, onOriginalNodesChange, onOriginalEdgesChange])

	if (!loading && initialNodes.length === 0) {
		return <div className='flex h-full w-full items-center justify-center text-slate-500'>No graph data</div>
	}

	return (
		<div className='relative h-full w-full overflow-hidden rounded border border-slate-200'>
			{loading && (
				<div className='absolute inset-0 z-10 flex items-center justify-center bg-white/50'>
					<Spin />
				</div>
			)}
			<ReactFlow
				nodes={flow_nodes}
				edges={flow_edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onNodeDragStart={onNodeDragStart}
				onNodeDrag={onNodeDrag}
				onNodeDragStop={onNodeDragStop}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodeClick={(_, node) => onNodeClick?.(node.id)}
				fitView
				minZoom={0.1}
				maxZoom={2}
				nodesDraggable={true}
				panOnDrag={true}
				selectionOnDrag={false}
				style={{ cursor: 'default' }}
				attributionPosition='bottom-left'
			>
				<Background color='var(--color-border-light)' gap={40} variant={BackgroundVariant.Lines} />
			</ReactFlow>
		</div>
	)
}

export default memo(MemoryGraph)

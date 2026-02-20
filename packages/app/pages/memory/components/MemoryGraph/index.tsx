import { useEffect, useMemo, useState } from 'react'
import {
	Background,
	Controls,
	MiniMap,
	ReactFlow,
	useEdgesState,
	useNodesState,
	BackgroundVariant
} from '@xyflow/react'
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force'
import { Spin } from 'antd'
import '@xyflow/react/dist/style.css'

import { memo } from '@/utils'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'

import type { Node, Edge } from '@xyflow/react'

interface MemoryGraphProps {
	nodes: Array<{
		id: string
		label: string
		x: number
		y: number
		activation: number
		potential: number
		metadata?: Record<string, unknown> | null
	}>
	edges: Array<{
		source_id: string
		target_id: string
		weight: number
		distance: number
		type?: string | null
		metadata?: Record<string, unknown> | null
	}>
	loading?: boolean
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
	const { nodes: initialNodes, edges: initialEdges, loading = false } = props

	const [flow_nodes, setNodes, onNodesChange] = useNodesState<Node>([])
	const [flow_edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

	console.log(flow_nodes)
	console.log(flow_edges)

	const [simulation, setSimulation] = useState<any>(null)

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

		const simNodes = graphData.nodes.map(d => ({
			...d,
			x: (Math.random() - 0.5) * 500,
			y: (Math.random() - 0.5) * 500
		}))
		const simLinks = graphData.links.map(d => ({
			...d,
			source: d.source,
			target: d.target
		}))

		const getRadius = (n: any) => {
			return 150 // Constant simulated bounding radius for large (260x140) cards to avoid overlap
		}

		const sim = forceSimulation(simNodes as any)
			.force('charge', forceManyBody().strength(-1000)) // Repel everything strongly
			.force(
				'collide',
				forceCollide((node: any) => {
					return 160 // Buffer for 260x84 cards
				}).iterations(5)
			)
			.force(
				'cluster_x',
				forceX((node: any) => {
					// Isolate clusters onto distinct focal coordinates around a circle
					if (graphData.clusters.length <= 1) return 0
					const angle = (node.clusterIdx / graphData.clusters.length) * 2 * Math.PI
					return Math.cos(angle) * 700
				}).strength(0.08)
			)
			.force(
				'cluster_y',
				forceY((node: any) => {
					if (graphData.clusters.length <= 1) return 0
					const angle = (node.clusterIdx / graphData.clusters.length) * 2 * Math.PI
					return Math.sin(angle) * 700
				}).strength(0.08)
			)
			.force(
				'link',
				forceLink(simLinks as any)
					.id((d: any) => d.id)
					.distance((link: any) => {
						return 350
					})
					.strength(1)
			)

		sim.on('tick', () => {
			setNodes(
				sim.nodes().map((node: any) => {
					return {
						id: node.id,
						// Offset by half of 260x84 approx card dimensions (avg)
						position: { x: node.x - 130, y: node.y - 42 },
						data: {
							label: node.label,
							potential: node.potential,
							activation: node.activation,
							clusterColor: node.clusterColor,
							metadata: node.metadata
						},
						type: 'customNode'
					}
				})
			)

			const getOptimalHandles = (nodeA: any, nodeB: any) => {
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

				for (const a of handlesA) {
					for (const b of handlesB) {
						const dist = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
						if (dist < minDist) {
							minDist = dist
							bestA = a.id
							bestB = b.id
						}
					}
				}
				return { sourceHandle: bestA + '-source', targetHandle: bestB + '-target' }
			}

			setEdges(
				simLinks.map((edge: any) => {
					const handles = getOptimalHandles(edge.source, edge.target)
					return {
						id: `${edge.source.id}_${edge.target.id}_${edge.type || 'rel'}`,
						source: edge.source.id,
						target: edge.target.id,
						sourceHandle: handles.sourceHandle,
						targetHandle: handles.targetHandle,
						type: 'customEdge',
						animated: edge.weight > 1,
						data: {
							type: edge.type,
							weight: edge.weight,
							distance: edge.distance
						}
					}
				})
			)
		})

		setSimulation(sim)

		return () => {
			sim.stop()
		}
	}, [graphData, setNodes, setEdges])

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
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
				minZoom={0.1}
				maxZoom={2}
				nodesDraggable={true} // Allow dragging diagram nodes
				attributionPosition='bottom-left'
			>
				{/* Architecture style faint graph paper lines */}
				<Background color='#cbd5e1' gap={32} size={1} variant={BackgroundVariant.Lines} />
			</ReactFlow>
		</div>
	)
}

export default memo(MemoryGraph)

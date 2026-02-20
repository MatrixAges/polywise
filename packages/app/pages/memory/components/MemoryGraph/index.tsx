import { useEffect, useRef, useState, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceCollide } from 'd3-force'
import { Spin } from 'antd'

import { memo } from '@/utils'

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
	const fgRef = useRef<any>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

	useEffect(() => {
		if (!containerRef.current) return

		// Instant load fix
		const rect = containerRef.current.getBoundingClientRect()
		if (rect.width > 0 && rect.height > 0) {
			setDimensions({ width: rect.width, height: rect.height })
		}

		const observer = new ResizeObserver(entries => {
			if (entries[0]) {
				const { width, height } = entries[0].contentRect
				setDimensions({ width, height })
			}
		})
		observer.observe(containerRef.current)
		return () => observer.disconnect()
	}, [initialNodes.length]) // Trigger layout setup on node data presence

	const graphData = useMemo(() => {
		const nodes = initialNodes.map(n => ({ ...n }))
		const links = initialEdges.map(e => ({ ...e, source: e.source_id, target: e.target_id }))

		// Cluster detection BFS
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

			// Simple shuffle to add uniqueness per render
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
		})

		return { nodes, links }
	}, [initialNodes, initialEdges])

	useEffect(() => {
		if (fgRef.current && graphData.nodes.length > 0) {
			// Increase distance for longer edges (reduced from 100 to 50)
			fgRef.current.d3Force('link').distance((link: any) => (link.distance || 1) * 50)
			fgRef.current.d3Force('charge').strength(-300)

			// Enforce absolute non-overlap (using updated sizes)
			fgRef.current.d3Force(
				'collide',
				forceCollide((node: any) => {
					const baseSize = 24
					return Math.max((node.potential || 1) * 60, baseSize) + 5 // Radius + 5px margin
				})
			)

			fgRef.current.zoomToFit(400, 50)
		}
	}, [graphData])

	if (!loading && initialNodes.length === 0) {
		return <div className='flex h-full w-full items-center justify-center text-slate-500'>No graph data</div>
	}

	return (
		<div
			ref={containerRef}
			className='relative h-full w-full overflow-hidden rounded border border-slate-200 bg-[#f8fafc]'
		>
			{loading && (
				<div className='absolute inset-0 z-10 flex items-center justify-center bg-white/50'>
					<Spin />
				</div>
			)}

			{dimensions.width > 0 && dimensions.height > 0 && graphData.nodes.length > 0 && (
				<ForceGraph2D
					ref={fgRef}
					width={dimensions.width}
					height={dimensions.height}
					graphData={graphData}
					enableNodeDrag={false}
					onNodeClick={node => console.log('Clicked node', node)}
					onLinkClick={link => console.log('Clicked link', link)}
					nodeCanvasObject={(node: any, ctx, globalScale) => {
						const label = node.label || ''
						const potential = node.potential || 1

						const baseSize = 24
						const nodeR = Math.max(potential * 60, baseSize)

						ctx.beginPath()
						ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI, false)

						// Solid styling using cluster color, 50% opacity
						ctx.save()
						ctx.globalAlpha = 0.5
						ctx.fillStyle = node.clusterColor
						ctx.fill()
						ctx.restore()

						ctx.lineWidth = 2 / globalScale
						// Border using original cluster color 100% opacity
						ctx.strokeStyle = node.clusterColor
						ctx.stroke()

						// Node text styling (naturally scaling with canvas)
						const fontSize = 12
						ctx.font = `300 ${fontSize}px Sans-Serif`
						ctx.textAlign = 'center'
						ctx.textBaseline = 'middle'
						ctx.fillStyle = '#334155'

						const maxWidth = nodeR * 2.5
						let line = ''
						const lines = []
						for (let i = 0; i < label.length; i++) {
							const testLine = line + label[i]
							const metrics = ctx.measureText(testLine)
							if (metrics.width > maxWidth && line.length > 0) {
								lines.push(line)
								line = label[i]
							} else {
								line = testLine
							}
						}
						lines.push(line)

						const lineHeight = fontSize * 1.2
						const startY = node.y - ((lines.length - 1) * lineHeight) / 2
						lines.forEach((l, idx) => {
							ctx.fillText(l, node.x, startY + idx * lineHeight)
						})
					}}
					nodePointerAreaPaint={(node: any, color, ctx) => {
						const baseSize = 24
						const nodeR = Math.max((node.potential || 1) * 60, baseSize)
						ctx.fillStyle = color
						ctx.beginPath()
						ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI, false)
						ctx.fill()
					}}
					linkColor={() => '#cbd5e1'}
					linkWidth={1.5}
					linkCanvasObjectMode={() => 'after'}
					linkCanvasObject={(link: any, ctx, globalScale) => {
						const start = link.source
						const end = link.target

						if (typeof start !== 'object' || typeof end !== 'object') return

						const textPos = {
							x: start.x + (end.x - start.x) / 2,
							y: start.y + (end.y - start.y) / 2
						}

						const relLink = { x: end.x - start.x, y: end.y - start.y }

						let textAngle = Math.atan2(relLink.y, relLink.x)
						if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle)
						if (textAngle < -Math.PI / 2) textAngle = -(Math.PI + textAngle)

						const label = link.type || ''
						if (!label) return

						const maxChars = 20
						const displayLabel =
							label.length > maxChars ? label.substring(0, maxChars) + '...' : label

						// Scale naturally with canvas
						const fontSize = 10
						ctx.font = `300 ${fontSize}px Sans-Serif`

						ctx.save()
						ctx.translate(textPos.x, textPos.y)
						ctx.rotate(textAngle)

						ctx.textAlign = 'center'
						ctx.textBaseline = 'middle'

						const textWidth = ctx.measureText(displayLabel).width
						const textHeight = fontSize

						// 0.6 standard black background
						ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
						ctx.fillRect(-textWidth / 2 - 4, -textHeight / 2 - 2, textWidth + 8, textHeight + 4)

						// Text right on the edge line
						ctx.fillStyle = '#f8fafc'
						ctx.fillText(displayLabel, 0, 0)

						ctx.restore()
					}}
				/>
			)}
		</div>
	)
}

export default memo(MemoryGraph)

import { useEffect, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
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

const MemoryGraph = (props: MemoryGraphProps) => {
	const { nodes: initialNodes, edges: initialEdges, loading = false } = props
	const fgRef = useRef<any>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

	useEffect(() => {
		if (!containerRef.current) return
		const observer = new ResizeObserver(entries => {
			if (entries[0]) {
				const { width, height } = entries[0].contentRect
				setDimensions({ width, height })
			}
		})
		observer.observe(containerRef.current)
		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		if (fgRef.current && initialNodes.length > 0) {
			// Compact the layout (shorter force distance)
			fgRef.current.d3Force('link').distance((link: any) => (link.distance || 1) * 30) // distance was 150
			fgRef.current.d3Force('charge').strength(-300) // previously -800

			// Optional: zoom to fit on initial load
			fgRef.current.zoomToFit(400, 50)
		}
	}, [initialNodes, initialEdges])

	if (!loading && initialNodes.length === 0) {
		return <div className='flex h-full w-full items-center justify-center text-slate-500'>No graph data</div>
	}

	const graphData = {
		nodes: initialNodes.map(n => ({ ...n })),
		links: initialEdges.map(e => ({ ...e, source: e.source_id, target: e.target_id }))
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

			{dimensions.width > 0 && dimensions.height > 0 && initialNodes.length > 0 && (
				<ForceGraph2D
					ref={fgRef}
					width={dimensions.width}
					height={dimensions.height}
					graphData={graphData}
					// Disallow dragging nodes
					enableNodeDrag={false}
					// Click handlers
					onNodeClick={node => {
						console.log('Clicked node', node)
					}}
					onLinkClick={link => {
						console.log('Clicked link', link)
					}}
					nodeCanvasObject={(node: any, ctx, globalScale) => {
						const label = node.label
						const potential = node.potential || 1
						const activation = node.activation || 0

						// Node styling (3x larger than before)
						const baseSize = 24 // originally 8
						const nodeR = Math.max(potential * 60, baseSize) // originally * 20
						const isHot = activation > 0.3

						ctx.beginPath()
						ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI, false)
						ctx.fillStyle = isHot ? '#fecaca' : potential > 0.8 ? '#a5f3fc' : '#e0e7ff'
						ctx.fill()

						ctx.lineWidth = 2 / globalScale
						ctx.strokeStyle = isHot ? '#fca5a5' : potential > 0.8 ? '#67e8f9' : '#c7d2fe'
						ctx.stroke()

						// Node text styling (0.8x font size, no shadow)
						const fontSize = (10 / globalScale) * 0.8
						ctx.font = `300 ${fontSize}px Sans-Serif` // using thin (300)
						ctx.textAlign = 'center'
						ctx.textBaseline = 'top'
						ctx.fillStyle = '#334155'

						ctx.fillText(label, node.x, node.y + nodeR + 4 / globalScale)
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
					linkWidth={1}
					linkCanvasObjectMode={() => 'after'}
					linkCanvasObject={(link: any, ctx, globalScale) => {
						const start = link.source
						const end = link.target

						// ignore unbound links
						if (typeof start !== 'object' || typeof end !== 'object') return

						const textPos = {
							x: start.x + (end.x - start.x) / 2,
							y: start.y + (end.y - start.y) / 2
						}

						const relLink = { x: end.x - start.x, y: end.y - start.y }

						let textAngle = Math.atan2(relLink.y, relLink.x)
						// Maintain label upright
						if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle)
						if (textAngle < -Math.PI / 2) textAngle = -(Math.PI + textAngle)

						const label = link.type || ''

						if (!label) return

						// Cut label length
						const maxChars = 20
						const displayLabel =
							label.length > maxChars ? label.substring(0, maxChars) + '...' : label

						const fontSize = (8 / globalScale) * 0.8 // 0.8x size as requested
						ctx.font = `300 ${fontSize}px Sans-Serif`

						ctx.save()
						ctx.translate(textPos.x, textPos.y)
						ctx.rotate(textAngle)

						// Draw text exactly parallel to line, no shadow
						ctx.textAlign = 'center'
						ctx.textBaseline = 'bottom'
						ctx.fillStyle = '#94a3b8'
						// small offset to sit right "on" the line
						ctx.fillText(displayLabel, 0, -(2 / globalScale))

						ctx.restore()
					}}
				/>
			)}
		</div>
	)
}

export default memo(MemoryGraph)

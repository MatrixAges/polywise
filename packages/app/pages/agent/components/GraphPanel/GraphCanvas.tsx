import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useSize } from '@/hooks'

import {
	getDefaultViewport,
	getEdgeColor,
	getEdgeLabel,
	getEdgeOpacity,
	getEdgeWidth,
	getLinkNode,
	getNodeColor,
	getNodeLabelLines,
	getNodeLabelWidth
} from './graph'
import useGraphSimulation from './useGraphSimulation'

import type { AgentGraphEdge, AgentGraphNode } from '../../types'
import type { GraphViewport } from './graph'

interface IProps {
	nodes: Array<AgentGraphNode>
	edges: Array<AgentGraphEdge>
	selected_node_id: string
	graph_loading: boolean
	graph_expanding: boolean
	can_expand_graph: boolean
	on_select_node: (node_id: string) => void
	on_expand_graph: () => void
}

const Index = (props: IProps) => {
	const {
		nodes,
		edges,
		selected_node_id,
		graph_loading,
		graph_expanding,
		can_expand_graph,
		on_select_node,
		on_expand_graph
	} = props
	const { t } = useTranslation('agent')
	const ref_container = useRef<HTMLDivElement | null>(null)
	const ref_dragging = useRef(null as null | { pointer_id: number; origin_x: number; origin_y: number })
	const ref_expand_key = useRef('')
	const size = useSize(() => ref_container.current as HTMLElement)
	const chart_id = useId().replace(/:/g, '')
	const [viewport, setViewport] = useState<GraphViewport>(getDefaultViewport)
	const [is_dragging, setIsDragging] = useState(false)
	const [hovered_edge_id, setHoveredEdgeId] = useState('')
	const canvas_size = useMemo(() => {
		const width = typeof size === 'object' ? (size?.width ?? 0) : 0
		const height = typeof size === 'object' ? (size?.height ?? 0) : 0

		return {
			width: Math.max(320, Math.floor(width)),
			height: Math.max(420, Math.floor(height))
		}
	}, [size])
	const { layout_nodes, layout_edges } = useGraphSimulation({
		nodes,
		edges,
		width: canvas_size.width,
		height: canvas_size.height
	})
	const node_map = useMemo(() => new Map(layout_nodes.map(item => [item.id, item])), [layout_nodes])
	const hovered_edge = useMemo(
		() => layout_edges.find(edge_item => edge_item.id === hovered_edge_id) ?? null,
		[hovered_edge_id, layout_edges]
	)

	useEffect(() => {
		if (nodes.length === 0) {
			setViewport(getDefaultViewport())
		}
	}, [nodes.length])

	useEffect(() => {
		ref_expand_key.current = ''
	}, [selected_node_id, nodes.length])

	const tryExpandGraph = (next_scale: number) => {
		if (!can_expand_graph || graph_expanding || next_scale < 1.28) {
			return
		}

		const expand_key = `${selected_node_id}:${nodes.length}`

		if (ref_expand_key.current === expand_key) {
			return
		}

		ref_expand_key.current = expand_key
		on_expand_graph()
	}

	return (
		<div
			className='
				relative
				overflow-hidden
				flex flex-1
				min-h-[420px]
				bg-[#f8fafc]
				touch-none select-none cursor-grab
			'
			ref={ref_container}
			onWheel={event => {
				event.preventDefault()

				const container_rect = event.currentTarget.getBoundingClientRect()
				const pointer_x = event.clientX - container_rect.left
				const pointer_y = event.clientY - container_rect.top
				const scale_delta = event.deltaY < 0 ? 1.12 : 0.9

				setViewport(current_viewport => {
					const next_scale = Math.max(0.68, Math.min(2.8, current_viewport.scale * scale_delta))
					const graph_x = (pointer_x - current_viewport.x) / current_viewport.scale
					const graph_y = (pointer_y - current_viewport.y) / current_viewport.scale
					const next_viewport = {
						scale: next_scale,
						x: pointer_x - graph_x * next_scale,
						y: pointer_y - graph_y * next_scale
					} satisfies GraphViewport

					if (event.deltaY < 0) {
						tryExpandGraph(next_scale)
					}

					return next_viewport
				})
			}}
			onPointerDown={event => {
				const target = event.target as HTMLElement

				if (target.closest('[data-node-anchor="true"]')) {
					return
				}

				ref_dragging.current = {
					pointer_id: event.pointerId,
					origin_x: event.clientX - viewport.x,
					origin_y: event.clientY - viewport.y
				}
				setIsDragging(true)
				event.currentTarget.setPointerCapture(event.pointerId)
			}}
			onPointerMove={event => {
				const dragging_state = ref_dragging.current

				if (!dragging_state || dragging_state.pointer_id !== event.pointerId) {
					return
				}

				setViewport(current_viewport => ({
					...current_viewport,
					x: event.clientX - dragging_state.origin_x,
					y: event.clientY - dragging_state.origin_y
				}))
			}}
			onPointerUp={event => {
				if (ref_dragging.current?.pointer_id !== event.pointerId) {
					return
				}

				ref_dragging.current = null
				setIsDragging(false)
				event.currentTarget.releasePointerCapture(event.pointerId)
			}}
			onPointerLeave={() => {
				if (!is_dragging) {
					setHoveredEdgeId('')
				}
			}}
			onPointerCancel={event => {
				if (ref_dragging.current?.pointer_id !== event.pointerId) {
					return
				}

				ref_dragging.current = null
				setIsDragging(false)
			}}
		>
			<svg
				className={$cx('h-full w-full', is_dragging && 'cursor-grabbing')}
				viewBox={`0 0 ${canvas_size.width} ${canvas_size.height}`}
				role='img'
				aria-label={t('graph_panel.title', { ns: 'agent' })}
			>
				<defs>
					<pattern id={`${chart_id}-grid`} width='40' height='40' patternUnits='userSpaceOnUse'>
						<path
							d='M 40 0 L 0 0 0 40'
							fill='none'
							stroke='rgba(148,163,184,0.11)'
							strokeWidth='1'
						></path>
					</pattern>
				</defs>
				<rect width={canvas_size.width} height={canvas_size.height} fill='white'></rect>
				<rect
					width={canvas_size.width}
					height={canvas_size.height}
					fill={`url(#${chart_id}-grid)`}
				></rect>
				<g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
					{layout_edges.map(edge_item => {
						const source_node = getLinkNode(edge_item.source, node_map)
						const target_node = getLinkNode(edge_item.target, node_map)

						if (!source_node || !target_node) {
							return null
						}

						const edge_label = getEdgeLabel(edge_item, {
							source_name: source_node.name,
							target_name: target_node.name
						})

						return (
							<g key={edge_item.id}>
								<line
									x1={source_node.x}
									y1={source_node.y}
									x2={target_node.x}
									y2={target_node.y}
									stroke={getEdgeColor(edge_item)}
									strokeOpacity={
										hovered_edge_id === edge_item.id
											? 0.78
											: getEdgeOpacity(edge_item)
									}
									strokeWidth={
										hovered_edge_id === edge_item.id
											? getEdgeWidth(edge_item) + 0.8
											: getEdgeWidth(edge_item)
									}
									strokeLinecap='round'
								>
									<title>{edge_label}</title>
								</line>
								<line
									x1={source_node.x}
									y1={source_node.y}
									x2={target_node.x}
									y2={target_node.y}
									stroke='transparent'
									strokeWidth='14'
									strokeLinecap='round'
									onMouseEnter={() => setHoveredEdgeId(edge_item.id)}
									onMouseLeave={() =>
										setHoveredEdgeId(current_value =>
											current_value === edge_item.id ? '' : current_value
										)
									}
								></line>
							</g>
						)
					})}
					{hovered_edge &&
						(() => {
							const source_node = getLinkNode(hovered_edge.source, node_map)
							const target_node = getLinkNode(hovered_edge.target, node_map)

							if (!source_node || !target_node) {
								return null
							}

							const label_text = getEdgeLabel(hovered_edge, {
								source_name: source_node.name,
								target_name: target_node.name
							})
							const center_x = ((source_node.x ?? 0) + (target_node.x ?? 0)) / 2
							const center_y = ((source_node.y ?? 0) + (target_node.y ?? 0)) / 2
							const label_width = Math.max(72, Math.min(180, label_text.length * 7.4 + 20))

							return (
								<g
									transform={`translate(${center_x}, ${center_y - 12})`}
									pointerEvents='none'
								>
									<rect
										x={-label_width / 2}
										y='-15'
										width={label_width}
										height='28'
										rx='10'
										fill='rgba(15,23,42,0.9)'
									></rect>
									<text
										textAnchor='middle'
										fontSize='11'
										fontWeight='600'
										fill='white'
										y='4'
									>
										{label_text}
									</text>
								</g>
							)
						})()}
					{layout_nodes.map(node_item => {
						const label_lines = getNodeLabelLines(node_item.name)
						const label_width = getNodeLabelWidth(label_lines)
						const label_height = label_lines.length > 1 ? 30 : 22

						return (
							<g
								key={node_item.id}
								className='cursor-pointer'
								data-node-anchor='true'
								transform={`translate(${node_item.x ?? 0}, ${node_item.y ?? 0})`}
								onClick={() => on_select_node(node_item.id)}
							>
								<circle
									r={node_item.radius + 10}
									fill='transparent'
									stroke='transparent'
									strokeWidth='10'
								></circle>
								{node_item.id === selected_node_id && (
									<circle
										r={node_item.radius + 6}
										fill='rgba(249,115,22,0.12)'
										stroke='rgba(249,115,22,0.24)'
										strokeWidth='1.5'
									></circle>
								)}
								<circle
									r={node_item.radius}
									fill={getNodeColor(node_item, selected_node_id)}
									fillOpacity={node_item.id === selected_node_id ? 0.96 : 0.9}
									stroke='rgba(255,255,255,0.98)'
									strokeWidth={node_item.id === selected_node_id ? 2.5 : 1.5}
								></circle>
								<g transform={`translate(0, ${node_item.radius + 14})`}>
									<rect
										x={-label_width / 2}
										y={-label_height / 2}
										width={label_width}
										height={label_height}
										rx='11'
										fill='rgba(255,255,255,0.92)'
										stroke={
											node_item.id === selected_node_id
												? 'rgba(249,115,22,0.34)'
												: 'rgba(148,163,184,0.2)'
										}
									></rect>
									<text
										textAnchor='middle'
										fontSize='11'
										fontWeight={node_item.id === selected_node_id ? 700 : 500}
										fill='#0f172a'
									>
										{label_lines.map((line_item, index) => (
											<tspan
												key={`${node_item.id}-${line_item}-${index}`}
												x='0'
												y={
													label_lines.length === 1
														? 4
														: index === 0
															? -1
															: 11
												}
											>
												{line_item}
											</tspan>
										))}
									</text>
								</g>
							</g>
						)
					})}
				</g>
			</svg>
			{graph_loading && nodes.length === 0 && (
				<div
					className='
						absolute
						inset-0
						flex
						items-center justify-center
						text-sm text-std-500
						bg-white/58
						backdrop-blur-[2px]
					'
				>
					{t('graph_panel.loading', { ns: 'agent' })}
				</div>
			)}
			{!graph_loading && nodes.length === 0 && (
				<div
					className='
						absolute
						inset-0
						flex
						items-center justify-center
						px-6
						text-sm text-std-400
						text-center
					'
				>
					{t('graph_panel.empty', { ns: 'agent' })}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)

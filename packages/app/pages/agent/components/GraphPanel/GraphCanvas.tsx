import { useId, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useSize } from '@/hooks'

import { getEdgeColor, getEdgeOpacity, getEdgeWidth, getLinkNode, getNodeColor, getNodeLabel } from './graph'
import useGraphSimulation from './useGraphSimulation'

import type { AgentGraphEdge, AgentGraphNode } from '../../types'

interface IProps {
	nodes: Array<AgentGraphNode>
	edges: Array<AgentGraphEdge>
	selected_node_id: string
	graph_loading: boolean
	on_select_node: (node_id: string) => void
}

const Index = (props: IProps) => {
	const { nodes, edges, selected_node_id, graph_loading, on_select_node } = props
	const { t } = useTranslation('agent')
	const ref_container = useRef<HTMLDivElement | null>(null)
	const size = useSize(() => ref_container.current as HTMLElement)
	const clip_id = useId().replace(/:/g, '')
	const canvas_size = useMemo(() => {
		const width = typeof size === 'object' ? (size?.width ?? 0) : 0
		const height = typeof size === 'object' ? (size?.height ?? 0) : 0

		return Math.max(280, Math.min(width, height))
	}, [size])
	const { layout_nodes, layout_edges } = useGraphSimulation({
		nodes,
		edges,
		width: canvas_size,
		height: canvas_size
	})
	const node_map = useMemo(() => new Map(layout_nodes.map(item => [item.id, item])), [layout_nodes])

	return (
		<div
			className='
				relative
				overflow-hidden
				flex flex-1
				items-center justify-center
				min-h-[360px]
				rounded-[28px]
				border border-border-light
			'
			ref={ref_container}
		>
			<svg
				className='h-full w-full'
				viewBox={`0 0 ${canvas_size} ${canvas_size}`}
				role='img'
				aria-label={t('graph_panel.title', { ns: 'agent' })}
			>
				<defs>
					<clipPath id={clip_id}>
						<circle cx={canvas_size / 2} cy={canvas_size / 2} r={canvas_size / 2 - 10}></circle>
					</clipPath>
				</defs>
				<g clipPath={`url(#${clip_id})`}>
					<circle
						cx={canvas_size / 2}
						cy={canvas_size / 2}
						r={canvas_size / 2 - 10}
						fill='rgba(255,255,255,0.64)'
						stroke='rgba(148,163,184,0.28)'
						strokeWidth='1.5'
					></circle>
					{layout_edges.map(edge_item => {
						const source_node = getLinkNode(edge_item.source, node_map)
						const target_node = getLinkNode(edge_item.target, node_map)

						if (!source_node || !target_node) {
							return null
						}

						return (
							<line
								key={edge_item.id}
								x1={source_node.x}
								y1={source_node.y}
								x2={target_node.x}
								y2={target_node.y}
								stroke={getEdgeColor(edge_item)}
								strokeOpacity={getEdgeOpacity(edge_item)}
								strokeWidth={getEdgeWidth(edge_item)}
								strokeLinecap='round'
							></line>
						)
					})}
					{layout_nodes.map(node_item => (
						<g
							key={node_item.id}
							className='cursor-pointer'
							transform={`translate(${node_item.x ?? 0}, ${node_item.y ?? 0})`}
							onClick={() => on_select_node(node_item.id)}
						>
							<circle
								r={node_item.radius + 6}
								fill='transparent'
								stroke='transparent'
								strokeWidth='10'
							></circle>
							<circle
								r={node_item.radius}
								fill={getNodeColor(node_item, selected_node_id)}
								fillOpacity={node_item.id === selected_node_id ? 0.96 : 0.88}
								stroke={
									node_item.id === selected_node_id
										? '#fed7aa'
										: 'rgba(255,255,255,0.9)'
								}
								strokeWidth={node_item.id === selected_node_id ? 3 : 2}
							></circle>
							{(node_item.radius >= 22 || node_item.id === selected_node_id) && (
								<text
									y={node_item.radius + 16}
									textAnchor='middle'
									fontSize='11'
									fontWeight={node_item.id === selected_node_id ? 700 : 500}
									fill='#0f172a'
								>
									{getNodeLabel(node_item.name)}
								</text>
							)}
						</g>
					))}
				</g>
			</svg>
			{graph_loading && (
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

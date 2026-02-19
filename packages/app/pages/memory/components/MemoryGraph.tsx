import { useMemo, useState } from 'react'
import { Background, Controls, MarkerType, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react'
import { Spin } from 'antd'
import '@xyflow/react/dist/style.css'

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
	const { nodes, edges, loading = false } = props
	const [selected_info, set_selected_info] = useState('')

	const initialNodes = useMemo(
		() =>
			nodes.map(node => ({
				id: node.id,
				position: { x: node.x, y: node.y },
				data: {
					label: `${node.label}\nA:${node.activation.toFixed(2)} P:${node.potential.toFixed(2)}`
				},
				type: 'default',
				style: {
					background: '#fff',
					border: `1px solid ${node.activation > 0.01 ? '#1677ff' : '#777'}`,
					borderRadius: '8px',
					padding: '10px',
					fontSize: '12px',
					maxWidth: '220px',
					wordBreak: 'break-word'
				}
			})),
		[nodes]
	)

	const initialEdges = useMemo(
		() =>
			edges.map((edge, index) => ({
				id: `${edge.source_id}_${edge.target_id}_${index}`,
				source: edge.source_id,
				target: edge.target_id,
				type: 'smoothstep',
				animated: edge.weight > 1,
				label: `${edge.type || 'edge'} | w:${edge.weight.toFixed(2)} d:${edge.distance.toFixed(2)}`,
				labelStyle: { fontSize: 10, fill: '#334155' },
				style: { stroke: '#555', strokeWidth: Math.min(Math.max(edge.weight, 1), 4) },
				markerEnd: { type: MarkerType.ArrowClosed }
			})),
		[edges]
	)

	const [flow_nodes, , onNodesChange] = useNodesState(initialNodes)
	const [flow_edges, , onEdgesChange] = useEdgesState(initialEdges)

	if (!loading && flow_nodes.length === 0) {
		return <div className='flex h-full w-full items-center justify-center text-slate-500'>No graph data</div>
	}

	return (
		<div className='h-full w-full overflow-hidden rounded border border-slate-200'>
			<Spin spinning={loading} className='h-full w-full'>
				<ReactFlow
					nodes={flow_nodes}
					edges={flow_edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onNodeClick={(_, node) =>
						set_selected_info(`Node ${node.id}: ${String(node.data.label)}`)
					}
					onEdgeClick={(_, edge) => set_selected_info(`Edge ${edge.id}: ${edge.label || ''}`)}
					fitView
					attributionPosition='bottom-left'
				>
					<Background color='#aaa' gap={16} />
					<Controls />
					<MiniMap
						nodeStrokeColor={() => '#555'}
						nodeColor={() => '#fff'}
						maskColor='rgba(240, 240, 240, 0.6)'
					/>
				</ReactFlow>
			</Spin>

			{selected_info && (
				<div className='pointer-events-none absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-xs text-slate-700 shadow'>
					{selected_info}
				</div>
			)}
		</div>
	)
}

export default memo(MemoryGraph)

import { useCallback, useMemo } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Panel, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { memo } from '@/utils'

interface MemoryGraphProps {
	data: {
		nodes: Array<{
			id: string
			data: { label: string }
			position: { x: number; y: number }
		}>
		edges: Array<{
			id: string
			source: string
			target: string
			type?: string
			animated?: boolean
		}>
	}
}

const MemoryGraph = (props: MemoryGraphProps) => {
	const { data } = props

	const initialNodes = useMemo(
		() =>
			data.nodes.map(node => ({
				id: node.id,
				position: node.position,
				data: { label: node.data.label },
				type: 'default',
				style: {
					background: '#fff',
					border: '1px solid #777',
					borderRadius: '8px',
					padding: '10px',
					fontSize: '12px',
					maxWidth: '180px',
					wordBreak: 'break-word'
				}
			})),
		[data.nodes]
	)

	const initialEdges = useMemo(
		() =>
			data.edges.map(edge => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				type: edge.type || 'smoothstep',
				animated: edge.animated || false,
				style: { stroke: '#555' },
				markerEnd: { type: 'arrowclosed' as const }
			})),
		[data.edges]
	)

	const [nodes, , onNodesChange] = useNodesState(initialNodes)
	const [edges, , onEdgesChange] = useEdgesState(initialEdges)

	if (data.nodes.length === 0) {
		return <div className='flex h-full w-full items-center justify-center text-slate-500'>No graph data</div>
	}

	return (
		<div className='h-full w-full overflow-hidden rounded border border-slate-200'>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
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
		</div>
	)
}

export default memo(MemoryGraph)

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
// @ts-ignore
import * as THREE from 'three'
// @ts-ignore
import { Spin } from 'antd'

import { memo } from '@/utils'
import GraphForceModel from './components/GraphForceModel'

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

	if (!loading && nodes.length === 0) {
		return <div className='flex h-full w-full items-center justify-center text-slate-500'>No graph data</div>
	}

	return (
		<div className='relative h-full w-full overflow-hidden rounded border border-slate-200'>
			{loading && (
				<div className='absolute inset-0 z-10 flex items-center justify-center bg-white/50'>
					<Spin />
				</div>
			)}

			<div className='h-full w-full bg-slate-50'>
				<Canvas camera={{ position: [0, 0, 500], fov: 60 }}>
					<ambientLight intensity={0.5} />
					<pointLight position={[100, 100, 100]} intensity={1} />

					{nodes.length > 0 && (
						<GraphForceModel nodes={nodes} edges={edges} onSelect={set_selected_info} />
					)}

					<OrbitControls makeDefault />
				</Canvas>
			</div>

			{selected_info && (
				<div className='pointer-events-none absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-xs text-slate-700 shadow'>
					{selected_info}
				</div>
			)}
		</div>
	)
}

export default memo(MemoryGraph)

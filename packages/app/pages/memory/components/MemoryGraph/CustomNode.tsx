import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export type CustomNodeData = {
	label: string
	clusterColor: string
	potential: number
}

const CustomNode = ({ data, selected }: NodeProps) => {
	const { label, clusterColor, potential } = data as CustomNodeData

	const baseSize = 24
	const calculatedSize = Math.max((potential || 0) * 60, baseSize)

	return (
		<div className='pointer-events-auto relative flex flex-col items-center justify-center'>
			<div
				className='flex items-center justify-center overflow-visible rounded-full shadow-sm'
				style={{
					width: `${calculatedSize * 2}px`, // R * 2
					height: `${calculatedSize * 2}px`,
					// 30% Opacity background using tailwind / hex mixing is hard dynamically, so we use structural CSS
					backgroundColor: clusterColor,
					opacity: 0.3,
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					zIndex: -1
				}}
			/>
			{/* Border ring (100% opacity) */}
			<div
				className='rounded-full'
				style={{
					width: `${calculatedSize * 2}px`,
					height: `${calculatedSize * 2}px`,
					border: selected ? `2px solid #555` : `2px solid ${clusterColor}`,
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					pointerEvents: 'none',
					zIndex: 0
				}}
			/>

			<div
				className='flex items-center justify-center text-center break-words'
				style={{
					width: `${calculatedSize * 2.5}px`, // Allow text to span little outside the bubble horizontally
					zIndex: 10
				}}
			>
				<span className='block text-[12px] leading-tight font-light text-slate-700'>{label}</span>
			</div>

			<Handle type='target' position={Position.Top} className='h-0 w-0 opacity-0' />
			<Handle type='source' position={Position.Bottom} className='h-0 w-0 opacity-0' />
			<Handle type='target' position={Position.Left} className='h-0 w-0 opacity-0' />
			<Handle type='source' position={Position.Right} className='h-0 w-0 opacity-0' />
		</div>
	)
}

export default memo(CustomNode)

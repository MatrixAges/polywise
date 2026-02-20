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
		<div
			className='pointer-events-auto relative flex flex-col items-center justify-center'
			style={{
				width: `${calculatedSize * 2}px`,
				height: `${calculatedSize * 2}px`
			}}
		>
			{/* 30% Opacity background */}
			<div
				className='absolute inset-0 rounded-full'
				style={{
					backgroundColor: clusterColor,
					opacity: 0.3,
					zIndex: -1
				}}
			/>
			{/* Border ring (100% opacity) */}
			<div
				className='absolute inset-0 rounded-full'
				style={{
					border: selected ? `2px solid #555` : `2px solid ${clusterColor}`,
					pointerEvents: 'none',
					zIndex: 0
				}}
			/>

			{/* Text Wrapper allowed to overflow slightly horizontally but anchored center */}
			<div className='relative z-10 flex w-[125%] items-center justify-center text-center break-words'>
				<span className='pointer-events-none block text-[12px] leading-tight font-light text-slate-700'>
					{label}
				</span>
			</div>

			<Handle type='target' position={Position.Top} className='h-0 w-0 opacity-0' />
			<Handle type='source' position={Position.Bottom} className='h-0 w-0 opacity-0' />
			<Handle type='target' position={Position.Left} className='h-0 w-0 opacity-0' />
			<Handle type='source' position={Position.Right} className='h-0 w-0 opacity-0' />
		</div>
	)
}

export default memo(CustomNode)

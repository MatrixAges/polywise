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

	return (
		<div
			className={`pointer-events-auto relative flex h-[100px] w-[100px] flex-col items-center justify-center gap-1 rounded-full bg-white p-3 shadow-sm transition-shadow ${
				selected ? 'shadow-md ring-2 ring-slate-400' : ''
			}`}
			style={{
				border: `1px solid ${clusterColor}`
			}}
		>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2 text-slate-800'>
					<span className='text-[15px]' title={label}>
						{label}
					</span>
				</div>
			</div>

			<div className='flex items-center justify-between text-[12px] text-slate-500'>
				<span className='text-slate-700'>{potential?.toFixed(2) || '0.00'}</span>
			</div>

			<Handle
				type='target'
				position={Position.Top}
				id='top-target'
				className='h-[6px] w-[6px] rounded-full border border-black opacity-0'
			/>
			<Handle
				type='source'
				position={Position.Top}
				id='top-source'
				className='pointer-events-none absolute h-0 w-0 border-0 opacity-0'
			/>
			{/* Bottom */}
			<Handle
				type='target'
				position={Position.Bottom}
				id='bottom-target'
				className='h-[6px] w-[6px] rounded-full border border-black opacity-0'
			/>
			<Handle
				type='source'
				position={Position.Bottom}
				id='bottom-source'
				className='pointer-events-none absolute h-0 w-0 border-0 opacity-0'
			/>
			{/* Left */}
			<Handle
				type='target'
				position={Position.Left}
				id='left-target'
				className='h-[6px] w-[6px] rounded-full border border-black opacity-0'
			/>
			<Handle
				type='source'
				position={Position.Left}
				id='left-source'
				className='pointer-events-none absolute h-0 w-0 border-0 opacity-0'
			/>
			{/* Right */}
			<Handle
				type='target'
				position={Position.Right}
				id='right-target'
				className='h-[6px] w-[6px] rounded-full border border-black opacity-0'
			/>
			<Handle
				type='source'
				position={Position.Right}
				id='right-source'
				className='pointer-events-none absolute h-0 w-0 border-0 opacity-0'
			/>
		</div>
	)
}

export default memo(CustomNode)

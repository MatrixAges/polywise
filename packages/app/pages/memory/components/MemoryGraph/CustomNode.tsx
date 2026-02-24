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
			className={`relative flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full border-2 border-white/80 text-white shadow-[0_0_15px_rgba(255,126,95,0.4)] transition-all ${
				selected ? 'scale-110 ring-4 ring-white/50' : ''
			}`}
			style={{
				background: `radial-gradient(circle at 30% 30%, ${clusterColor}, #feb47b)`,
				boxShadow: `0 0 20px ${clusterColor}66`
			}}
		>
			<div className='pointer-events-none flex flex-col items-center justify-center text-center leading-tight'>
				<span className='max-w-[50px] overflow-hidden px-1 text-[10px] font-bold text-ellipsis whitespace-nowrap drop-shadow-md'>
					{label}
				</span>
			</div>

			<Handle
				type='target'
				position={Position.Top}
				id='top-target'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>
			<Handle
				type='source'
				position={Position.Top}
				id='top-source'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>

			<Handle
				type='target'
				position={Position.Bottom}
				id='bottom-target'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>
			<Handle
				type='source'
				position={Position.Bottom}
				id='bottom-source'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>

			<Handle
				type='target'
				position={Position.Left}
				id='left-target'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>
			<Handle
				type='source'
				position={Position.Left}
				id='left-source'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>

			<Handle
				type='target'
				position={Position.Right}
				id='right-target'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>
			<Handle
				type='source'
				position={Position.Right}
				id='right-source'
				style={{ opacity: 0, border: 'none', background: 'transparent' }}
			/>
		</div>
	)
}

export default memo(CustomNode)

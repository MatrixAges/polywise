import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Server, Database, Globe, BrainCircuit } from 'lucide-react'

export type CustomNodeData = {
	label: string
	clusterColor: string
	potential: number
	activation: number
	metadata?: Record<string, unknown> | null
}

const CustomNode = ({ data, selected }: NodeProps) => {
	const { label, clusterColor, potential, activation, metadata } = data as CustomNodeData

	const isEndpoint = label.toLowerCase().includes('api') || label.toLowerCase().includes('endpoint')
	const isDb = label.toLowerCase().includes('database') || label.toLowerCase().includes('sql')

	const Icon = isEndpoint ? Globe : isDb ? Database : BrainCircuit

	return (
		<div
			className={`pointer-events-auto relative flex w-[260px] flex-col rounded-xl bg-white p-4 shadow-sm transition-shadow ${
				selected ? 'shadow-md ring-2 ring-slate-400' : ''
			}`}
			style={{
				border: `1px solid ${clusterColor}`
			}}
		>
			<div className='mb-3 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Icon size={18} style={{ color: clusterColor }} />
					<span className='line-clamp-1 text-[15px] font-semibold text-slate-800' title={label}>
						{label}
					</span>
				</div>
				<div
					className='rounded-full px-2 py-[2px] text-[10px] font-medium tracking-wide'
					style={{ backgroundColor: `${clusterColor}15`, color: clusterColor }}
				>
					{potential > 0 ? `POT: ${potential.toFixed(1)}` : 'PROD'}
				</div>
			</div>

			<div className='flex flex-col gap-[2px] text-[12px] text-slate-500'>
				<div className='flex items-center justify-between'>
					<span>Activation:</span>
					<span className='text-slate-700'>{activation?.toFixed(2) || '0.00'}</span>
				</div>
				{metadata &&
					Object.keys(metadata)
						.slice(0, 2)
						.map(key => (
							<div key={key} className='flex items-center justify-between'>
								<span className='capitalize'>{key}:</span>
								<span className='max-w-[120px] truncate text-slate-700'>
									{String(metadata[key])}
								</span>
							</div>
						))}
				{!metadata && (
					<div className='mt-2 leading-tight text-slate-400'>
						General purpose semantic cluster node representation.
					</div>
				)}
			</div>

			{/* Top */}
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

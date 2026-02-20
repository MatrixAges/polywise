import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

export type CustomEdgeData = {
	type?: string | null
	weight: number
	distance: number
}

const CustomEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	data,
	selected
}: EdgeProps) => {
	const { type } = (data || {}) as CustomEdgeData

	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		borderRadius: 16
	})

	const maxChars = 20
	let displayLabel = type || ''
	if (displayLabel.length > maxChars) {
		displayLabel = displayLabel.substring(0, maxChars) + '...'
	}

	// Minor deterministic offset to handle parallel lines
	const hash = (id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
	const xOffset = (hash % 6) - 3
	const yOffset = ((hash * 7) % 6) - 3

	return (
		<>
			<BaseEdge
				path={edgePath}
				style={{
					...style,
					strokeWidth: selected ? 1.5 : 1,
					stroke: selected ? '#334155' : '#1e293b'
				}}
				id={id}
			/>
			{displayLabel && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX + xOffset}px,${
								labelY + yOffset
							}px)`,
							pointerEvents: 'all',
							zIndex: selected ? 20 : 10 + (hash % 5)
						}}
						className='nodrag nopan rounded-full border border-slate-300 bg-white px-3 py-[2px] shadow-sm'
					>
						<span className='text-[11px] font-medium whitespace-nowrap text-slate-700'>
							{displayLabel}
						</span>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	)
}

export default memo(CustomEdge)

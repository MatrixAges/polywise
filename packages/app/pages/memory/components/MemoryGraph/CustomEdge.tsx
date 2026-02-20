import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
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
	markerEnd,
	data,
	selected
}: EdgeProps) => {
	const { type } = (data || {}) as CustomEdgeData

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition
	})

	const maxChars = 20
	let displayLabel = type || ''
	if (displayLabel.length > maxChars) {
		displayLabel = displayLabel.substring(0, maxChars) + '...'
	}

	// Calculate angle aligning parallel with straight line between anchors
	let textAngle = Math.atan2(targetY - sourceY, targetX - sourceX)
	if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle)
	if (textAngle < -Math.PI / 2) textAngle = -(Math.PI + textAngle)
	const angleDeg = textAngle * (180 / Math.PI)

	return (
		<>
			<BaseEdge
				path={edgePath}
				style={{
					...style,
					strokeWidth: selected ? 2 : 1.5,
					stroke: selected ? '#64748b' : '#cbd5e1'
				}}
				id={id}
			/>
			{displayLabel && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) rotate(${angleDeg}deg)`,
							pointerEvents: 'all'
						}}
						className='nodrag nopan rounded bg-black/60 px-1 py-[2px] shadow-sm'
					>
						<span className='text-[10px] font-light whitespace-nowrap text-slate-100'>
							{displayLabel}
						</span>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	)
}

export default memo(CustomEdge)

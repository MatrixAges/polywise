import { memo } from 'react'
import { EdgeLabelRenderer, Position } from '@xyflow/react'
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
	const { label } = (data || {}) as any

	// Node configuration
	const nodeRadius = 30 // Half of 60px

	const getCenter = (x: number, y: number, pos: Position) => {
		switch (pos) {
			case Position.Left:
				return { x: x + nodeRadius, y }
			case Position.Right:
				return { x: x - nodeRadius, y }
			case Position.Top:
				return { x, y: y + nodeRadius }
			case Position.Bottom:
				return { x, y: y - nodeRadius }
			default:
				return { x, y }
		}
	}

	const sourceCenter = getCenter(sourceX, sourceY, sourcePosition as Position)
	const targetCenter = getCenter(targetX, targetY, targetPosition as Position)

	const sourceCenterX = sourceCenter.x
	const sourceCenterY = sourceCenter.y
	const targetCenterX = targetCenter.x
	const targetCenterY = targetCenter.y

	// Vector from Source Center to Target Center
	const dx = targetCenterX - sourceCenterX
	const dy = targetCenterY - sourceCenterY
	const distance = Math.sqrt(dx * dx + dy * dy)

	if (distance === 0) return null

	// Angle of the connection
	const angle = Math.atan2(dy, dx)

	// Spread angle for the "wrapping" effect
	const spreadAngle = 0.5

	// Connection points on the circle boundaries
	// Source points
	const sourceA1x = sourceCenterX + nodeRadius * Math.cos(angle - spreadAngle)
	const sourceA1y = sourceCenterY + nodeRadius * Math.sin(angle - spreadAngle)
	const sourceA2x = sourceCenterX + nodeRadius * Math.cos(angle + spreadAngle)
	const sourceA2y = sourceCenterY + nodeRadius * Math.sin(angle + spreadAngle)

	// Target points (opposite side)
	const targetB1x = targetCenterX + nodeRadius * Math.cos(angle + Math.PI + spreadAngle)
	const targetB1y = targetCenterY + nodeRadius * Math.sin(angle + Math.PI + spreadAngle)
	const targetB2x = targetCenterX + nodeRadius * Math.cos(angle + Math.PI - spreadAngle)
	const targetB2y = targetCenterY + nodeRadius * Math.sin(angle + Math.PI - spreadAngle)

	// Thickness parameters
	const weight = (data as any)?.weight || 0
	const midThickness = 2 + weight * 2 // Biological look

	// Normal vector for middle offset
	const nxMid = -Math.sin(angle)
	const nyMid = Math.cos(angle)

	const centerMidX = (sourceCenterX + targetCenterX) / 2
	const centerMidY = (sourceCenterY + targetCenterY) / 2

	const topMidTargetX = centerMidX + nxMid * -midThickness
	const topMidTargetY = centerMidY + nyMid * -midThickness

	const botMidTargetX = centerMidX - nxMid * -midThickness
	const botMidTargetY = centerMidY - nyMid * -midThickness

	// Solve for control points C such that Bezier passes through midTarget at t=0.5
	const M1x = 2 * topMidTargetX - 0.5 * (sourceA1x + targetB1x)
	const M1y = 2 * topMidTargetY - 0.5 * (sourceA1y + targetB1y)

	const M2x = 2 * botMidTargetX - 0.5 * (sourceA2x + targetB2x)
	const M2y = 2 * botMidTargetY - 0.5 * (sourceA2y + targetB2y)

	// Construct Path
	const path = `
    M ${sourceA1x},${sourceA1y}
    Q ${M1x},${M1y} ${targetB1x},${targetB1y}
    A ${nodeRadius} ${nodeRadius} 0 0 0 ${targetB2x},${targetB2y}
    Q ${M2x},${M2y} ${sourceA2x},${sourceA2y}
    A ${nodeRadius} ${nodeRadius} 0 0 0 ${sourceA1x},${sourceA1y}
    Z
  `

	const hash = (id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
	const labelX = centerMidX
	const labelY = centerMidY

	return (
		<>
			<path
				d={path}
				fill={selected ? '#334155' : '#475569'}
				fillOpacity={0.4}
				stroke={selected ? '#64748b' : 'none'}
				strokeWidth={selected ? 1 : 0}
				className='react-flow__edge-path cursor-pointer'
				style={style}
			/>
			{label && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							pointerEvents: 'all',
							zIndex: selected ? 20 : 10 + (hash % 5)
						}}
						className='nodrag nopan rounded-full border border-slate-200 bg-white/80 px-2 py-[1px] shadow-sm backdrop-blur-[2px]'
					>
						<span className='text-[9px] font-medium whitespace-nowrap text-slate-600'>
							{label}
						</span>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	)
}

export default memo(CustomEdge)

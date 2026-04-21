import { useCallback, useEffect, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'

import type { Variants } from 'motion/react'
import type { HTMLAttributes } from 'react'

export interface GripIconHandle {
	startAnimation: () => void
	stopAnimation: () => void
}

interface GripProps extends HTMLAttributes<HTMLDivElement> {
	size?: number
}

const CIRCLES = [
	{ cx: 19, cy: 5 },
	{ cx: 19, cy: 12 },
	{ cx: 12, cy: 5 },
	{ cx: 19, cy: 19 },
	{ cx: 12, cy: 12 },
	{ cx: 5, cy: 5 },
	{ cx: 12, cy: 19 },
	{ cx: 5, cy: 12 },
	{ cx: 5, cy: 19 }
]

const VARIANTS: Variants = {
	normal: {
		opacity: 1,
		transition: { duration: 0.25 }
	},
	animate: (index: number) => ({
		opacity: [1, 0.3, 0.3, 1],
		transition: {
			delay: index * 0.07,
			duration: 1.1,
			times: [0, 0.2, 0.8, 1]
		}
	})
}

const Index = ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }: GripProps) => {
	const controls = useAnimation()
	const isAnimatingRef = useRef(false)

	const startAnimation = useCallback(async () => {
		if (isAnimatingRef.current) return
		isAnimatingRef.current = true
		await controls.start('animate')
		await controls.start('normal')
		isAnimatingRef.current = false
	}, [controls])

	const stopAnimation = useCallback(async () => {
		if (!isAnimatingRef.current) return
		await controls.start('normal')
		isAnimatingRef.current = false
	}, [controls])

	useEffect(() => {
		startAnimation()

		return () => {
			stopAnimation()
		}
	}, [])

	return (
		<div className={$cx('inline-flex items-center justify-center', className)} {...props}>
			<svg
				fill='none'
				height={size}
				stroke='currentColor'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeWidth='2'
				viewBox='0 0 24 24'
				width={size}
				xmlns='http://www.w3.org/2000/svg'
			>
				{CIRCLES.map((circle, index) => (
					<motion.circle
						animate={controls}
						custom={index}
						cx={circle.cx}
						cy={circle.cy}
						initial='normal'
						key={`${circle.cx}-${circle.cy}`}
						r='1'
						variants={VARIANTS}
					/>
				))}
			</svg>
		</div>
	)
}

export default $app.memo(Index)

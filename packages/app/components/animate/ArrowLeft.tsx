import { useCallback, useEffect, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'

import type { Variants } from 'motion/react'
import type { HTMLAttributes } from 'react'

interface ArrowLeftProps extends HTMLAttributes<HTMLDivElement> {
	size?: number
}

const PATH_VARIANTS: Variants = {
	normal: { d: 'm12 19-7-7 7-7', translateX: 0 },
	animate: {
		d: 'm12 19-7-7 7-7',
		translateX: [0, 3, 0],
		transition: {
			duration: 0.4,
			repeat: Infinity,
			repeatType: 'loop',
			repeatDelay: 0.1
		}
	}
}

const SECOND_PATH_VARIANTS: Variants = {
	normal: { d: 'M19 12H5' },
	animate: {
		d: ['M19 12H5', 'M19 12H10', 'M19 12H5'],
		transition: {
			duration: 0.4,
			repeat: Infinity,
			repeatType: 'loop',
			repeatDelay: 0.1
		}
	}
}

const Index = ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }: ArrowLeftProps) => {
	const controls = useAnimation()
	const is_animating_ref = useRef(false)

	const startAnimation = useCallback(async () => {
		if (is_animating_ref.current) return

		is_animating_ref.current = true

		await controls.start('animate')
	}, [controls])

	const stopAnimation = useCallback(async () => {
		if (!is_animating_ref.current) return

		controls.stop()

		await controls.start('normal')

		is_animating_ref.current = false
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
				<motion.path animate={controls} d='m12 19-7-7 7-7' variants={PATH_VARIANTS} />
				<motion.path animate={controls} d='M19 12H5' variants={SECOND_PATH_VARIANTS} />
			</svg>
		</div>
	)
}

export default $app.memo(Index)

import { memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { useMounted } from '@/hooks'

import type { MotionNodeAnimationOptions } from 'motion'
import type { MouseEventHandler, PropsWithChildren } from 'react'

export interface IProps extends PropsWithChildren, Pick<MotionNodeAnimationOptions, 'initial' | 'animate' | 'exit'> {
	visible: boolean | null | undefined
	className?: string
	id?: string
	onClick?: MouseEventHandler<HTMLDivElement>
}

const Index = (props: IProps) => {
	const { children, initial, animate, exit, visible, className, onClick } = props
	const mounted = useMounted()

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					className={className}
					initial={mounted ? initial : false}
					animate={animate}
					exit={exit || (initial as Exclude<MotionNodeAnimationOptions['initial'], boolean>)}
					transition={{ duration: 0.18, ease: 'easeInOut' }}
					onClick={onClick}
				>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default memo(Index)

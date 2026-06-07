import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useClickAway } from 'ahooks'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'

import styles from './index.module.css'

import type { CSSProperties, MouseEvent, ReactNode } from 'react'

export interface DrawerProps {
	children: ReactNode
	open: boolean
	placement?: 'left' | 'right' | 'top' | 'bottom'
	className?: string
	maskClassName?: string
	contentClassName?: string
	title?: string
	desc?: string
	width?: string | number
	height?: string | number
	maskClosable?: boolean
	zIndex?: number
	header?: (onClose: DrawerProps['onClose']) => ReactNode
	onClose?: (e?: MouseEvent<HTMLElement>) => void
	getRef?: (v: HTMLElement | null) => void
	getContainer?: () => HTMLElement | null
}

type LayoutConfig = {
	align?: string
	style: CSSProperties
	transform: string
}

const Index = (props: DrawerProps) => {
	const {
		children,
		open,
		placement = 'left',
		className,
		maskClassName,
		contentClassName,
		title,
		desc,
		width,
		height = 300,
		maskClosable,
		zIndex = 1001,
		header,
		onClose,
		getRef,
		getContainer
	} = props

	const ref_content_wrap = useRef<HTMLDivElement>(null)
	const ref_content = useRef<HTMLDivElement>(null)
	const [exist, setExist] = useState(false)

	const container = getContainer?.() || document.body

	useEffect(() => {
		if (!open) {
			const timer = setTimeout(() => setExist(false), 180)
			document.body.removeAttribute('data-scroll-locked')
			return () => clearTimeout(timer)
		}

		setExist(true)

		document.body.setAttribute('data-scroll-locked', '1')

		const handleHashChange = () => onClose?.()

		window.addEventListener('popstate', handleHashChange)

		return () => window.removeEventListener('popstate', handleHashChange)
	}, [open])

	useClickAway(e => {
		if (!maskClosable || e.target !== ref_content_wrap.current) return

		onClose?.()
	}, ref_content)

	const { align, transform, style } = useMemo(() => {
		const configs: Record<string, LayoutConfig> = {
			left: { style: { width }, transform: 'translate3d(-100%, 0px, 0px)' },
			right: { align: 'justify-end', style: { width }, transform: 'translate3d(100%, 0px, 0px)' },
			top: { style: { width: '100%', height }, transform: 'translate3d(0px, -100%, 0px)' },
			bottom: {
				align: 'items-end justify-center',
				style: { width: '100%', maxWidth: width ?? '100%', height },
				transform: 'translate3d(0px, 100%, 0px)'
			}
		}

		return configs[placement]
	}, [placement, width, height])

	const Header = useMemo(() => {
		if (header) return header(onClose)
		if (!title) return null

		return (
			<div
				className={$cx(
					styles.header,
					`
					relative
					box-border
					flex
					items-center justify-between
					w-full
					p-4
				`
				)}
			>
				<div className='flex flex-col gap-0.5'>
					<span className='font-medium'>{title}</span>
					{desc && <span className='text-muted-foreground text-sm'>{desc}</span>}
				</div>
				<span className='icon_button' onClick={onClose}>
					<X />
				</span>
			</div>
		)
	}, [title, desc, onClose, header])

	if (!exist) return null

	const content_node = (
		<Fragment>
			<AnimatePresence>
				{open && (
					<motion.div
						className={$cx(
							styles.mask,
							!getContainer && styles.on_body,
							maskClassName,
							'h-full w-full backdrop-blur-md select-none'
						)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.18, ease: 'easeInOut' }}
						style={{ zIndex }}
					/>
				)}
			</AnimatePresence>
			<div
				className={$cx(
					styles.content_wrap,
					!getContainer && styles.on_body,
					align,
					className,
					`
					box-border
					flex
					w-full h-full
					select-none
				`
				)}
				ref={ref_content_wrap}
				style={{ zIndex: zIndex + 1 }}
			>
				<AnimatePresence>
					{open && (
						<motion.div
							className={$cx(
								styles.content,
								contentClassName,
								`
								box-border
								flex flex-col
								bg-layout-over
							`
							)}
							initial={{ transform: transform }}
							animate={{ transform: 'translate3d(0px, 0px, 0px)' }}
							exit={{ transform: transform }}
							transition={{ duration: 0.18, ease: 'easeInOut' }}
							style={style}
							ref={ref_content}
						>
							{Header}
							<div
								className={$cx(
									styles.body,
									`
									box-border
									flex flex-col
									w-full
									px-4
								`
								)}
								ref={getRef}
							>
								{children}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</Fragment>
	)

	return createPortal(content_node, container)
}

export default $app.memo(Index)

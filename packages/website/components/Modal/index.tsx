'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { useClickAway } from '@website/hooks/ahooks'
import { $ } from '@website/utils'
import { is_server } from '@website/utils/const'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

import styles from './index.module.css'

import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'

type CancelEvent = ReactMouseEvent<HTMLElement> | globalThis.MouseEvent | globalThis.TouchEvent

interface IProps {
	children: ReactNode
	open: boolean
	className?: HTMLDivElement['className']
	bodyClassName?: HTMLDivElement['className']
	title?: string | number
	width?: string | number
	minHeight?: string | number
	maskClosable?: boolean
	disableOverflow?: boolean
	disablePadding?: boolean
	hideClose?: boolean
	zIndex?: number
	onCancel?: (e?: CancelEvent) => void
	getContainer?: () => Element
	getRef?: (v: HTMLDivElement) => void
}

const Index = (props: IProps) => {
	const {
		children,
		open,
		className,
		bodyClassName,
		title,
		width,
		minHeight,
		maskClosable,
		disableOverflow,
		disablePadding,
		hideClose,
		zIndex,
		onCancel,
		getContainer,
		getRef
	} = props
	const ref_content_wrap = useRef<HTMLDivElement>(null)
	const ref_content = useRef<HTMLDivElement>(null)
	const [on_body, setOnbody] = useState(false)
	const [exsit, setExsit] = useState(false)

	if (is_server) return null

	const container = getContainer?.() || document.body

	useEffect(() => {
		if (open) {
			setExsit(true)

			document.body.style.setProperty('overflow-y', 'hidden')

			const handle_hash_change = () => onCancel?.()

			window.addEventListener('popstate', handle_hash_change)

			return () => {
				window.removeEventListener('popstate', handle_hash_change)
			}
		} else {
			const timer = setTimeout(() => {
				setExsit(false)
			}, 180)

			document.body.style.removeProperty('overflow-y')

			return () => clearTimeout(timer)
		}
	}, [open])

	useClickAway(e => {
		if (!maskClosable) return
		if (e.target !== ref_content_wrap.current) return

		onCancel?.(e)
	}, ref_content)

	useEffect(() => {
		setOnbody(container === document.body)
	}, [container])

	if (!exsit) return null

	const Content = (
		<Fragment>
			<AnimatePresence>
				{open && (
					<motion.div
						className={$.cx(styles.mask, on_body && styles.on_body, 'h-full w-full')}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.18, ease: 'easeInOut' }}
						style={{ zIndex: zIndex ?? 1001 }}
					></motion.div>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{open && (
					<motion.div
						className={$.cx(
							styles.content_wrap,
							on_body && styles.on_body,
							disableOverflow && styles.disableOverflow,
							disablePadding && styles.disablePadding,
							`
							box-border
							flex
							items-center
							w-full h-full
							if_modal_wrap
						`
						)}
						ref={ref_content_wrap}
						initial={{ transform: 'translate3d(0px, -30px, 0px)', opacity: 0 }}
						animate={{ transform: 'translate3d(0px, 0px, 0px)', opacity: 1 }}
						exit={{ transform: 'translate3d(0px, 30px, 0px)', opacity: 0 }}
						transition={{ duration: 0.18, ease: 'easeInOut' }}
						style={{ zIndex: zIndex ? zIndex + 1 : 1002 }}
					>
						<div
							className={$.cx(
								styles.content,
								className,
								'if_modal_content box-border flex flex-col'
							)}
							style={{ width: width ?? 360, minHeight }}
							ref={ref_content}
						>
							{title && (
								<div
									className={$.cx(
										styles.header,
										`
										box-border
										flex
										items-center justify-between
										w-full
									`
									)}
								>
									<span className='title'>{title}</span>
									{!hideClose && (
										<span
											className='
												flex
												items-center justify-center
												btn_close clickable
											'
											onClick={onCancel}
										>
											<XIcon size={14}></XIcon>
										</span>
									)}
								</div>
							)}
							<div
								className={$.cx(
									styles.body,
									bodyClassName,
									disableOverflow && styles.disableOverflow,
									`
									box-border
									flex flex-col
									w-full
									if_modal_body
								`
								)}
								ref={getRef}
							>
								{children}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</Fragment>
	)

	if (container) {
		return createPortal(Content, container)
	}

	return Content
}

export default $.memo(Index)

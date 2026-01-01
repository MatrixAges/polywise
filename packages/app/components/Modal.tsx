import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useClickAway } from 'ahooks'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'

import type { MouseEvent, ReactNode } from 'react'

export interface IProps {
	children: ReactNode
	open: boolean
	className?: string
	mask_class_name?: string
	title?: ReactNode
	width?: string | number
	max_width?: string | number
	min_height?: string | number
	height?: string | number
	mask_closable?: boolean
	z_index?: number
	flexiable?: boolean
	header?: (onClose: IProps['onClose']) => ReactNode
	onClose?: (e?: MouseEvent<HTMLElement>) => void
	getContainer?: () => Element
	getRef?: (v: HTMLDivElement) => void
}

const Index = (props: IProps) => {
	const {
		children,
		open,
		className,
		mask_class_name,
		title,
		width,
		max_width,
		min_height,
		height,
		mask_closable,
		z_index,
		flexiable,
		header,
		onClose,
		getContainer,
		getRef
	} = props
	const ref_content_wrap = useRef<HTMLDivElement>(null)
	const ref_content = useRef<HTMLDivElement>(null)
	const [on_body, setOnbody] = useState(false)
	const [exsit, setExsit] = useState(false)

	const container = getContainer?.() || document.body

	useEffect(() => {
		if (open) {
			setExsit(true)
			document.body.style.setProperty('overflow-y', 'hidden')
			const handle_hash_change = () => onClose?.()
			window.addEventListener('popstate', handle_hash_change)
			return () => window.removeEventListener('popstate', handle_hash_change)
		} else {
			const timer = setTimeout(() => setExsit(false), 180)
			document.body.style.removeProperty('overflow-y')
			return () => clearTimeout(timer)
		}
	}, [open])

	useClickAway(e => {
		if (!mask_closable) return
		if (e.target !== ref_content_wrap.current) return
		onClose?.(e as unknown as MouseEvent<HTMLDivElement>)
	}, ref_content)

	useEffect(() => {
		setOnbody(container === document.body)
	}, [container])

	const Header = useMemo(() => {
		if (header) return header(onClose)
		if (!title) return null

		return (
			<div
				className='
					box-border
					flex
					items-center justify-between
					w-full h-[21px]
					mb-4
					leading-none
				'
			>
				<span className='font-medium'>{title}</span>
				<span
					className='
						flex
						items-center justify-center
						w-6 h-6
						rounded-full
						hover:bg-std-200/60
						-mr-2 clickable
					'
					onClick={onClose}
				>
					<X size={14} />
				</span>
			</div>
		)
	}, [title, onClose, header])

	if (!exsit) return null

	const Content = (
		<Fragment>
			<AnimatePresence>
				{open && (
					<motion.div
						className={`
							top-0
							left-0
							w-full h-full
							bg-black/48
							backdrop-blur-sm
							select-none
							${on_body ? 'fixed' : 'absolute'}
							${mask_class_name}
						`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.18, ease: 'easeInOut' }}
						style={{ zIndex: z_index ?? 1001 }}
					/>
				)}
			</AnimatePresence>
			{exsit && (
				<div
					className={`
						top-0
						left-0
						box-border
						overflow-y-auto
						flex
						items-center
						w-full h-full
						select-none
						${on_body ? 'fixed' : 'absolute'}
						${flexiable && 'max-[720px]:p-0'}
					`}
					ref={ref_content_wrap}
					style={{ zIndex: z_index ? z_index + 1 : 1002 }}
				>
					<AnimatePresence>
						{open && (
							<motion.div
								className={`
									relative
									overflow-hidden
									flex flex-col
									max-h-full
									px-6 py-4
									mx-auto
									rounded-xl
									bg-std-100
									${flexiable && 'max-[720px]:m-0 max-[720px]:ml-[36px] max-[720px]:w-[calc(100vw-72px)]'}
									${className}
								`}
								ref={ref_content}
								initial={{ transform: 'translate3d(0px, -30px, 0px)', opacity: 0 }}
								animate={{ transform: 'translate3d(0px, 0px, 0px)', opacity: 1 }}
								exit={{ transform: 'translate3d(0px, 30px, 0px)', opacity: 0 }}
								transition={{ duration: 0.18, ease: 'easeInOut' }}
								style={{
									width: width ?? 360,
									maxWidth: max_width,
									minHeight: min_height,
									height
								}}
							>
								{Header}
								<div
									className={`
										box-border
										overflow-y-auto
										flex
										w-full
										${Header ? 'h-[calc(100%-30px)]' : 'h-full'}
									`}
									ref={getRef}
								>
									{children}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			)}
		</Fragment>
	)

	return createPortal(Content, container)
}

export default $app.memo(Index)

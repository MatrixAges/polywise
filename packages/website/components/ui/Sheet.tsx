'use client'

import { Dialog } from '@base-ui/react/dialog'
import { X } from '@phosphor-icons/react'
import { $ } from '@website/utils'

import styles from './Sheet.module.css'

import type { CSSProperties, ReactNode } from 'react'

type Placement = 'left' | 'right' | 'top'

interface IProps {
	open: boolean
	children: ReactNode
	placement?: Placement
	width?: number | string
	height?: number | string
	className?: string
	rootClassName?: string
	maskClosable?: boolean
	closeIcon?: ReactNode | false | null
	getContainer?: false | (() => HTMLElement)
	onClose: () => void
}

const Index = (props: IProps) => {
	const {
		open,
		children,
		placement = 'right',
		width,
		height,
		className,
		rootClassName,
		maskClosable = true,
		closeIcon,
		getContainer,
		onClose
	} = props

	const popup_style = {
		width: placement === 'top' ? '100vw' : width,
		height: placement === 'top' ? height : '100vh'
	} as CSSProperties

	const content = (
		<>
			<Dialog.Backdrop className={$.cx(styles.backdrop, 'fixed inset-0 z-[1100]')} />
			<Dialog.Popup
				className={$.cx(
					styles.popup,
					styles[placement],
					rootClassName,
					`
					fixed
					box-border
					overflow-hidden z-[1101]
					shadow-[0_24px_72px_rgba(0,0,0,0.24)]
				`
				)}
				style={popup_style}
			>
				{closeIcon !== false && closeIcon !== null && (
					<Dialog.Close
						aria-label='Close panel'
						className='
							absolute
							top-3 right-3
							z-[1]
							flex
							items-center justify-center
							w-8 h-8
							rounded-full
							text-[var(--color_text_light)]
							transition-colors duration-200
							hover:bg-[var(--color_bg_1)] hover:text-[var(--color_text)]
						'
					>
						{closeIcon ?? <X size={16} />}
					</Dialog.Close>
				)}
				<div className={$.cx('h-full w-full', className)}>{children}</div>
			</Dialog.Popup>
		</>
	)

	return (
		<Dialog.Root
			open={open}
			onOpenChange={next_open => !next_open && onClose()}
			disablePointerDismissal={!maskClosable}
		>
			<Dialog.Portal container={typeof getContainer === 'function' ? getContainer() : undefined}>
				{content}
			</Dialog.Portal>
		</Dialog.Root>
	)
}

export default $.memo(Index)

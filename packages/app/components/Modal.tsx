import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'

import type { MouseEvent, ReactNode } from 'react'

export interface IProps {
	children: ReactNode
	open: boolean
	className?: HTMLDivElement['className']
	title?: ReactNode
	width?: string | number
	onClose?: (e?: MouseEvent<HTMLElement>) => void
}

const Index = (props: IProps) => {
	const { children, open, className, title, width, onClose } = props

	return (
		<Dialog
			open={open}
			onOpenChange={v => {
				if (!v) onClose?.()
			}}
		>
			<DialogContent
				className={className}
				style={width ? { width, maxWidth: width } : undefined}
				showCloseButton
			>
				<If condition={!!title}>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
				</If>
				<div className='w-full'>{children}</div>
			</DialogContent>
		</Dialog>
	)
}

export default $app.memo(Index)

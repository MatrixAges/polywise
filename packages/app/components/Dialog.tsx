import {
	Dialog as BaseDialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/__shadcn__/components/ui/dialog'

import type { PropsWithChildren } from 'react'

interface IProps extends PropsWithChildren {
	open: boolean
	title: string
	desc?: string
	className?: string
	headerClassName?: string
	maxHeight?: string | number
	setOpen: (v: boolean) => void
}

const Index = (props: IProps) => {
	const { children, open, title, desc, className, headerClassName, maxHeight, setOpen } = props

	return (
		<BaseDialog open={open} onOpenChange={setOpen}>
			<DialogContent className={className}>
				<DialogHeader className={$cx('gap-0', headerClassName)}>
					<DialogTitle className='-mt-1 leading-6'>{title}</DialogTitle>
					{desc && <DialogDescription>{desc}</DialogDescription>}
				</DialogHeader>
				<div
					className={$cx(
						`
						overflow-y-auto
						w-full
					`,
						maxHeight
					)}
				>
					{children}
				</div>
			</DialogContent>
		</BaseDialog>
	)
}

export { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle }

export default $app.memo(Index)

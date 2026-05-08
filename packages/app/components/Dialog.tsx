import { Button } from '@/__shadcn__/components/ui/button'
import {
	Dialog,
	DialogClose,
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
	maxHeight?: string | number
	setOpen: (v: boolean) => void
}

const Index = (props: IProps) => {
	const { children, open, title, desc, className, maxHeight, setOpen } = props

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className={className}>
				<DialogHeader className='gap-0'>
					<DialogTitle className='-mt-1 leading-6'>{title}</DialogTitle>
					{desc && <DialogDescription>{desc}</DialogDescription>}
				</DialogHeader>
				<div
					className={$cx(
						`
						overflow-y-auto
						w-full
					`,
						maxHeight ?? 'max-h-[60vh]'
					)}
				>
					{children}
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default $app.memo(Index)

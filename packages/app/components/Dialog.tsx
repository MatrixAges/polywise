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
	max_height?: string | number
	setOpen: (v: boolean) => void
}

const Index = (props: IProps) => {
	const { children, open, title, desc, className, max_height, setOpen } = props

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className={className}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{desc && <DialogDescription>{desc}</DialogDescription>}
				</DialogHeader>
				<div
					className={$cx(
						`
						overflow-y-auto
						w-full
					`,
						max_height ?? 'max-h-[60vh]'
					)}
				>
					{children}
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default $app.memo(Index)

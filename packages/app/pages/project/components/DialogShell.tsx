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

import type { IPropsDialogShell } from './types'

const Index = (props: IPropsDialogShell) => {
	const { open, title, desc, confirm_text, children, content_class, onConfirm, onClose } = props

	return (
		<Dialog open={open} onOpenChange={next_open => !next_open && onClose()}>
			<DialogContent className={content_class}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{desc}</DialogDescription>
				</DialogHeader>
				{children}
				<DialogFooter>
					<DialogClose render={<Button variant='outline'>Cancel</Button>} />
					<Button onClick={onConfirm}>{confirm_text}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default $app.memo(Index)

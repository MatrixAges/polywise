import { useMemo } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/__shadcn__/components/ui/alert-dialog'
import { icon_map } from '@/appdata'

import type { ElementType } from 'react'

interface IProps {
	title: string
	desc: string
	open?: boolean
	confirm_text?: string
	cancel_text?: string
	Trigger?: ElementType
	icon?: string
	onConfirm?: (...args: Array<any>) => void
	onCancel?: () => void
}

const Index = (props: IProps) => {
	const {
		title,
		desc,
		open,
		confirm_text = 'Confirm',
		cancel_text = 'Cancel',
		Trigger,
		icon,
		onConfirm,
		onCancel
	} = props

	const Icon = useMemo(() => (icon ? icon_map[icon] : null), [icon])

	return (
		<AlertDialog open={open}>
			{Trigger && <AlertDialogTrigger render={<Trigger></Trigger>} />}
			<AlertDialogContent size='sm'>
				<AlertDialogHeader>
					{Icon && (
						<AlertDialogMedia>
							<Icon />
						</AlertDialogMedia>
					)}
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{desc}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>{cancel_text}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>{confirm_text}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default $app.memo(Index)

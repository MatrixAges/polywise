import { useMemo } from 'react'
import { BadgeAlert } from 'lucide-react'

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
	confirmText?: string
	cancelText?: string
	Trigger?: ElementType
	icon?: string
	info?: boolean
	onConfirm?: (...args: Array<any>) => void
	onCancel?: () => void
}

const Index = (props: IProps) => {
	const {
		title,
		desc,
		open,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		Trigger,
		icon,
		info,
		onConfirm,
		onCancel
	} = props

	const Icon = useMemo(() => (icon ? icon_map[icon] : BadgeAlert), [icon])

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
				<AlertDialogFooter className={$cx(info && 'grid-cols-1!')}>
					<AlertDialogCancel onClick={onCancel}>{info ? 'Get' : cancelText}</AlertDialogCancel>
					{!info && <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default $app.memo(Index)

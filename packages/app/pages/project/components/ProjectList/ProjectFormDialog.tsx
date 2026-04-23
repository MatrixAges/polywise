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
import { Input } from '@/__shadcn__/components/ui/input'

import type { ChangeEvent, KeyboardEvent } from 'react'

interface IProps {
	open: boolean
	title: string
	desc: string
	name_value: string
	dir_value?: string
	show_dir: boolean
	submit_text: string
	onChangeName: (value: string) => void
	onChangeDir?: (value: string) => void
	onSubmit: () => void
	onClose: () => void
}

const Index = (props: IProps) => {
	const {
		open,
		title,
		desc,
		name_value,
		dir_value,
		show_dir,
		submit_text,
		onChangeName,
		onChangeDir,
		onSubmit,
		onClose
	} = props

	return (
		<Dialog open={open} onOpenChange={next_open => !next_open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{desc}</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-3'>
					<Input
						placeholder='Project name'
						value={name_value}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							onChangeName(event.target.value)
						}
						onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								onSubmit()
							}
						}}
					></Input>
					{show_dir && (
						<Input
							placeholder='Project directory'
							value={dir_value || ''}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								onChangeDir?.(event.target.value)
							}
							onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
								if (event.key === 'Enter') {
									event.preventDefault()
									onSubmit()
								}
							}}
						></Input>
					)}
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant='outline'>Cancel</Button>} />
					<Button onClick={onSubmit}>{submit_text}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default $app.memo(Index)

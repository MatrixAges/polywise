import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'

import { Context } from './context'
import Detail from './Detail'
import EditDialog from './EditDialog'
import Menu from './Menu'
import Model from './model'

interface IProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const Index = (props: IProps) => {
	const { open, onOpenChange } = props
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		if (!open) {
			x.deinit()

			return
		}

		void x.init()

		return () => x.deinit()
	}, [open, x])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-[min(1200px,96vw)] gap-0 overflow-hidden p-0'>
				<DialogHeader className='border-border-light border-b px-6 py-4'>
					<DialogTitle>Skills</DialogTitle>
					<DialogDescription>
						Manage skill files and metadata without leaving agents.
					</DialogDescription>
				</DialogHeader>
				<Context value={x}>
					<div className='flex h-[min(78vh,760px)] overflow-hidden'>
						<Menu></Menu>
						<Detail></Detail>
					</div>
					<EditDialog></EditDialog>
				</Context>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

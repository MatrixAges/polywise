import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Dialog } from '@/components'

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
		<Dialog
			open={open}
			title='Skills'
			desc='Manage skill files and metadata without leaving agents.'
			className='
				overflow-hidden
				w-[840px] max-w-[96vw]!
				gap-0
				p-0
			'
			headerClassName='p-6 py-5 border-b border-border-light'
			maxHeight='max-h-[80vh]'
			setOpen={onOpenChange}
		>
			<Context value={x}>
				<div className='flex h-[min(78vh,760px)] overflow-hidden'>
					<Menu></Menu>
					<Detail></Detail>
				</div>
				<EditDialog></EditDialog>
			</Context>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

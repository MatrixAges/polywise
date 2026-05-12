import { useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Dialog } from '@/components'

import { useModel } from '../../context'
import { Context } from './context'
import Detail from './Detail'
import EditDialog from './EditDialog'
import Menu from './Menu'
import Model from './model'

const Index = () => {
	const { skill_dialog_open, setSkillDialogOpen } = useModel()
	const x = useMemo(() => container.resolve(Model), [])

	useEffect(() => {
		if (!skill_dialog_open) {
			x.deinit()

			return
		}

		void x.init()

		return () => x.deinit()
	}, [skill_dialog_open, x])

	return (
		<Dialog
			open={skill_dialog_open}
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
			setOpen={setSkillDialogOpen}
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

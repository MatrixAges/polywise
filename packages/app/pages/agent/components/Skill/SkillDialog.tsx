import { useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
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
	const { t } = useTranslation('agent')
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
			title={t('skill.title')}
			desc={t('skill.desc')}
			className='
				overflow-hidden
				w-[840px] max-w-[96vw]!
				gap-0
				p-0
			'
			headerClassName='p-6 py-5 border-b border-border-light'
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

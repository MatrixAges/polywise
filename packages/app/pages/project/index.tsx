import { useEffect, useState } from 'react'
import { Folders } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Session } from '@/components'
import { useGlobal } from '@/context'

import { AddModal, Menu, SidePanel } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const Actions = (
		<div className='flex items-center'>
			<span className='icon_button small' onClick={x.toggleFilesProjectId}>
				<Folders></Folders>
			</span>
		</div>
	)

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				{!global.setting.sidebar_collapsed && <Menu></Menu>}
				{x.selected_session_id && (
					<div className={$cx('h-full min-w-0 flex-1')}>
						<Session type='page' id={x.selected_session_id} actions={Actions}></Session>
					</div>
				)}
				{x.side_panel_open && <SidePanel></SidePanel>}
			</div>
			<AddModal></AddModal>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

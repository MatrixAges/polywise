import { Activity, useEffect, useState } from 'react'
import { Folders } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Session } from '@/components'
import { useGlobal } from '@/context'

import { AddModal, Menu, Preview, SidePanel } from './components'
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
				<div className='flex flex-1'>
					<Activity mode={x.content_tab === 'session' ? 'visible' : 'hidden'}>
						{x.selected_session_id && (
							<div className={$cx('h-full min-w-0 flex-1')}>
								<Session
									type='page'
									id={x.selected_session_id}
									actions={Actions}
								></Session>
							</div>
						)}
					</Activity>
					<Activity mode={x.content_tab === 'file' ? 'visible' : 'hidden'}>
						{x.project_files.select_file && <Preview></Preview>}
					</Activity>
				</div>
				{x.side_panel_open && <SidePanel></SidePanel>}
			</div>
			<AddModal></AddModal>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

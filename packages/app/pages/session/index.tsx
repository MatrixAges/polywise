import { useEffect, useState } from 'react'
import { Folders } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useLocation, useNavigate } from 'react-router'
import { container } from 'tsyringe'

import { Session } from '@/components'
import { useGlobal } from '@/context'

import { AddModal, Menu, Preview, SidePanel } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()
	const { pathname, state } = useLocation()
	const navigate = useNavigate()

	useEffect(() => {
		const run = async () => {
			await x.init()

			if (state?.menu_tab === 'projects' || state?.menu_tab === 'sessions' || state?.menu_tab === 'im') {
				x.setMenuTab(state.menu_tab)
			}

			if (state?.create) {
				await x.createSession()
			}

			if (state?.create || state?.menu_tab) {
				navigate(pathname, { replace: true, state: null })
			}
		}

		void run()

		return () => x.deinit()
	}, [])

	const Actions = (
		<div className='flex items-center'>
			<span className='icon_button small' onClick={x.toggleFiles}>
				<Folders></Folders>
			</span>
		</div>
	)

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				{!global.setting.sidebar_collapsed && <Menu></Menu>}
				<div className='flex min-w-0 flex-1'>
					{x.content_tab === 'session'
						? x.selected_session_id && (
								<div className={$cx('h-full min-w-0 flex-1')}>
									<Session
										type='page'
										id={x.selected_session_id}
										actions={Actions}
									></Session>
								</div>
							)
						: x.project_files.select_file && <Preview></Preview>}
				</div>
				{x.side_panel_open && <SidePanel></SidePanel>}
			</div>
			<AddModal></AddModal>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

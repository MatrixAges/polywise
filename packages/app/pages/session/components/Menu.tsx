import { FolderPlus, Folders, MessageSquareText, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Tabs, Tooltip } from '@/components'

import { useModel } from '../context'
import ProjectsMenu from './ProjectsMenu'
import SessionMenu from './SessionMenu'

const Index = () => {
	const { menu_tab, setMenuTab, onToggleAddModal, createSession } = useModel()

	return (
		<div
			className='
				overflow-y-hidden
				flex flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<div
				className='
					flex
					items-center
					h-8
					px-3
					border-b border-border-light
				'
			>
				<div className='flex min-w-0 flex-1'>
					<Tabs
						itemClassName='h-5.5!'
						iconSize={12}
						items={[
							{ key: 'projects', Icon: Folders },
							{ key: 'sessions', Icon: MessageSquareText }
						]}
						active={menu_tab}
						onClick={v => setMenuTab(v as 'projects' | 'sessions')}
					></Tabs>
				</div>
				<Tooltip title={menu_tab === 'projects' ? 'New Project' : 'New Session'}>
					<div
						className='icon_button small -mr-1'
						onClick={menu_tab === 'projects' ? onToggleAddModal : () => createSession()}
					>
						{menu_tab === 'projects' ? <FolderPlus></FolderPlus> : <Plus></Plus>}
					</div>
				</Tooltip>
			</div>
			<div className='min-h-0 flex-1 overflow-y-scroll'>
				{menu_tab === 'projects' ? <ProjectsMenu></ProjectsMenu> : <SessionMenu></SessionMenu>}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

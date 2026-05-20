import { Bot, FolderPlus, Folders, MessageCircleCheck, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Tabs, Tooltip } from '@/components'

import { useModel } from '../context'
import ProjectsMenu from './ProjectsMenu'
import SessionMenu from './SessionMenu'

const Index = () => {
	const { menu_tab, setMenuTab, onToggleAddModal, createSession } = useModel()
	const allow_create = menu_tab !== 'im'

	return (
		<div
			className='
				overflow-y-hidden
				flex flex-col shrink-0
				w-[210px] h-full
				bg-std-50/60
				dark:bg-std-100/60 dark:border-r dark:border-border-light/60
			'
		>
			<div
				className='
					flex
					items-center
					h-9
					px-1.5
				'
			>
				<div className='flex min-w-0 flex-1'>
					<Tabs
						small
						items={[
							{ key: 'sessions', Icon: MessageCircleCheck },
							{ key: 'projects', Icon: Folders },
							{ key: 'im', title: 'IM', Icon: Bot }
						]}
						active={menu_tab}
						onClick={v => setMenuTab(v as 'projects' | 'sessions' | 'im')}
					></Tabs>
				</div>
				{allow_create ? (
					<Tooltip title={menu_tab === 'projects' ? 'New Project' : 'New Session'}>
						<div
							className='icon_button small'
							onClick={menu_tab === 'projects' ? onToggleAddModal : () => createSession()}
						>
							{menu_tab === 'projects' ? <FolderPlus></FolderPlus> : <Plus></Plus>}
						</div>
					</Tooltip>
				) : null}
			</div>
			<div className='min-h-0 flex-1 overflow-y-scroll'>
				<div
					className='
						flex flex-col
						w-full
					'
				>
					{menu_tab === 'projects' ? <ProjectsMenu></ProjectsMenu> : <SessionMenu></SessionMenu>}
					<div className='h-1 opacity-0'>-</div>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

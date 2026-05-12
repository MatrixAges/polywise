import { Bot, MessagesSquare, PanelLeftOpen, Plus, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Tabs } from '@/components'

import { useModel } from '../context'
import AgentsMenu from './AgentsMenu'
import CreateDialog from './CreateDialog'
import GroupDialog from './GroupDialog'
import GroupsMenu from './GroupsMenu'
import { SkillDialog } from './Skill'

const Index = () => {
	const {
		menu_scope,
		page_mode,
		session_menu_open,
		setMenuScope,
		setSessionMenuOpen,
		openCreateAgentDialog,
		openCreateGroupDialog,
		openSkillDialog
	} = useModel()

	return (
		<>
			<div
				className='
					overflow-hidden
					flex flex-col
					w-[210px] h-full
					bg-std-50/60
					dark:bg-std-100/60 dark:border-r dark:border-border-light/60
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-9
						px-1.5
					'
				>
					<div className='flex min-w-0 flex-1'>
						<Tabs
							small
							items={[
								{ key: 'agent', title: 'Agents', Icon: Bot },
								{ key: 'group', title: 'Groups', Icon: MessagesSquare }
							]}
							active={menu_scope}
							onClick={v => setMenuScope(v as 'agent' | 'group')}
						></Tabs>
					</div>
					<div className='flex gap-1'>
						{menu_scope === 'agent' && page_mode === 'sessions' && !session_menu_open && (
							<button
								className='icon_button small'
								type='button'
								onClick={() => setSessionMenuOpen(true)}
							>
								<PanelLeftOpen className='size-3'></PanelLeftOpen>
							</button>
						)}
						{menu_scope === 'agent' && (
							<button className='icon_button small' type='button' onClick={openSkillDialog}>
								<Sparkles className='size-3'></Sparkles>
							</button>
						)}
						<button
							className='icon_button small'
							type='button'
							onClick={() => {
								if (menu_scope === 'group') {
									openCreateGroupDialog()
									return
								}

								openCreateAgentDialog()
							}}
						>
							<Plus className='size-3.5'></Plus>
						</button>
					</div>
				</div>
				<div className='flex min-h-0 flex-1 overflow-y-scroll'>
					<div
						className='
							flex flex-col
							w-full
							gap-0.5
							px-1.5
						'
					>
						{menu_scope === 'agent' ? <AgentsMenu></AgentsMenu> : <GroupsMenu></GroupsMenu>}
						<div className='h-1 opacity-0'>-</div>
					</div>
				</div>
			</div>
			<CreateDialog></CreateDialog>
			<GroupDialog></GroupDialog>
			<SkillDialog></SkillDialog>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

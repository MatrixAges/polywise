import { useState } from 'react'
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
	const { groups, menu_scope, page_mode, session_menu_open, setMenuScope, setSessionMenuOpen } = useModel()
	const [create_dialog_open, setCreateDialogOpen] = useState(false)
	const [group_dialog_open, setGroupDialogOpen] = useState(false)
	const [editing_group_id, setEditingGroupId] = useState('')
	const [skill_dialog_open, setSkillDialogOpen] = useState(false)
	const editing_group = groups.find(item => item.id === editing_group_id) || null

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
							<button
								className='icon_button small'
								type='button'
								onClick={() => setSkillDialogOpen(true)}
							>
								<Sparkles className='size-3'></Sparkles>
							</button>
						)}
						<button
							className='icon_button small'
							type='button'
							onClick={() => {
								if (menu_scope === 'group') {
									setEditingGroupId('')
									setGroupDialogOpen(true)
									return
								}

								setCreateDialogOpen(true)
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
							p-1.5 pt-0
						'
					>
						{menu_scope === 'agent' ? (
							<AgentsMenu></AgentsMenu>
						) : (
							<GroupsMenu
								onEditGroup={id => {
									setEditingGroupId(id)
									setGroupDialogOpen(true)
								}}
							></GroupsMenu>
						)}
					</div>
				</div>
			</div>
			<CreateDialog open={create_dialog_open} onOpenChange={setCreateDialogOpen}></CreateDialog>
			<GroupDialog
				open={group_dialog_open}
				group={editing_group}
				onOpenChange={open => {
					setGroupDialogOpen(open)

					if (!open) {
						setEditingGroupId('')
					}
				}}
			></GroupDialog>
			<SkillDialog open={skill_dialog_open} onOpenChange={setSkillDialogOpen}></SkillDialog>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

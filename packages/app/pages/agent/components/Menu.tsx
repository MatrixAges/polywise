import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Bot, MessagesSquare, PanelLeftOpen, Plus, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Tabs } from '@/components'

import { useModel } from '../context'
import CreateDialog from './CreateDialog'
import GroupDialog from './GroupDialog'
import GroupMenuItem from './GroupMenuItem'
import MenuItem from './MenuItem'
import { SkillDialog } from './Skill'

import type { DragEndEvent } from '@dnd-kit/core'

const Index = () => {
	const {
		agents,
		groups,
		menu_scope,
		page_mode,
		selected_agent_id,
		selected_group_id,
		session_menu_open,
		setMenuScope,
		setSessionMenuOpen,
		sortAgent,
		openGroup
	} = useModel()
	const [create_dialog_open, setCreateDialogOpen] = useState(false)
	const [group_dialog_open, setGroupDialogOpen] = useState(false)
	const [editing_group_id, setEditingGroupId] = useState('')
	const [skill_dialog_open, setSkillDialogOpen] = useState(false)
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
	const editing_group = groups.find(item => item.id === editing_group_id) || null

	const onDragEnd = (args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = agents.findIndex(item => item.id === active.id)
		const to = agents.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		sortAgent(from, to)
	}

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
						px-2
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
								<PanelLeftOpen className='size-3.5'></PanelLeftOpen>
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
						<DndContext sensors={sensors} onDragEnd={onDragEnd}>
							{menu_scope === 'agent' ? (
								<SortableContext
									items={agents.map(item => item.id)}
									strategy={verticalListSortingStrategy}
								>
									{agents.map(item => (
										<MenuItem
											item={item}
											selected={selected_agent_id === item.id}
											key={item.id}
										></MenuItem>
									))}
								</SortableContext>
							) : (
								<div className='flex flex-col gap-0.5'>
									{groups.map(item => (
										<GroupMenuItem
											item={item}
											selected={selected_group_id === item.id}
											key={item.id}
											onClick={() => void openGroup(item.id)}
											onEdit={() => {
												setEditingGroupId(item.id)
												setGroupDialogOpen(true)
											}}
										></GroupMenuItem>
									))}
									{!groups.length && (
										<div className='text-std-400 px-3 py-4 text-sm'>
											No groups yet.
										</div>
									)}
								</div>
							)}
						</DndContext>
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

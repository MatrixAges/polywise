import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BookOpenText, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import MenuItem from './MenuItem'
import { SkillDialog } from './Skill'

import type { DragEndEvent } from '@dnd-kit/core'

const Index = () => {
	const { agents, selected_agent_id, createAgent, sortAgent } = useModel()
	const [skill_dialog_open, setSkillDialogOpen] = useState(false)
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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
					w-[240px] h-full
					border-border-light border-r
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-8
						px-3
						border-b border-border-light
					'
				>
					<span className='text-xsm text-std-500 gap-2 font-medium'>Agents</span>
					<div className='mr-[-2px] flex'>
						<button
							className='icon_button small'
							type='button'
							onClick={() => setSkillDialogOpen(true)}
						>
							<BookOpenText className='size-3.5'></BookOpenText>
						</button>
						<button className='icon_button small' type='button' onClick={createAgent}>
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
							p-1.5
						'
					>
						<DndContext sensors={sensors} onDragEnd={onDragEnd}>
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
						</DndContext>
					</div>
				</div>
			</div>
			<SkillDialog open={skill_dialog_open} onOpenChange={setSkillDialogOpen}></SkillDialog>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

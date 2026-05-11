import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { useModel } from '../context'
import CreateDialog from './CreateDialog'
import MenuItem from './MenuItem'
import { SkillDialog } from './Skill'

import type { DragEndEvent } from '@dnd-kit/core'

const Index = () => {
	const { agents, selected_agent_id, create_agent_loading, sortAgent } = useModel()
	const [create_dialog_open, setCreateDialogOpen] = useState(false)
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
					w-[210px] h-full
					bg-std-50/60
					border-border-light border-r
					dark:bg-transparent
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-8
						px-2.5
					'
				>
					<span className='text-xsm text-std-500 gap-2 font-medium'>Agents</span>
					<div className='flex gap-1'>
						<button
							className='icon_button small'
							type='button'
							onClick={() => setSkillDialogOpen(true)}
						>
							<Sparkles className='size-3'></Sparkles>
						</button>
						<button
							className='icon_button small'
							type='button'
							onClick={() => setCreateDialogOpen(true)}
							disabled={create_agent_loading}
						>
							{create_agent_loading ? (
								<Spinner className='size-3.5'></Spinner>
							) : (
								<Plus className='size-3.5'></Plus>
							)}
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
			<CreateDialog open={create_dialog_open} onOpenChange={setCreateDialogOpen}></CreateDialog>
			<SkillDialog open={skill_dialog_open} onOpenChange={setSkillDialogOpen}></SkillDialog>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

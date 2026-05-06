import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Bot, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import MenuItem from './MenuItem'

import type { DragEndEvent } from '@dnd-kit/core'

const Index = () => {
	const { agents, selected_agent_id, createAgent, sortAgent } = useModel()
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
				<div
					className='
						flex
						items-center
						gap-2
						text-xsm text-std-500 font-medium
					'
				>
					<Bot className='size-3.5'></Bot>
					<span>Agents</span>
				</div>
				<button className='icon_button small' type='button' onClick={createAgent}>
					<Plus className='size-3.5'></Plus>
				</button>
			</div>
			<div className='flex min-h-0 flex-1 overflow-y-scroll'>
				<div
					className='
						flex flex-col
						w-full
						gap-1
						px-1.5 py-2
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
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

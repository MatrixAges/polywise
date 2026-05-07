import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BookText, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import MenuItem from './MenuItem'

import type { DragEndEvent } from '@dnd-kit/core'

const Index = () => {
	const { skill_items, selected_skill_id, createSkill, sortSkill } = useModel()
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const onDragEnd = (args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = skill_items.findIndex(item => item.id === active.id)
		const to = skill_items.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		void sortSkill(from, to)
	}

	return (
		<div
			className='
				overflow-hidden
				flex flex-col
				w-[210px] h-full
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
					<BookText className='size-3.5'></BookText>
					<span>Skills</span>
				</div>
				<button className='icon_button small' type='button' onClick={() => void createSkill()}>
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
							items={skill_items.map(item => item.id)}
							strategy={verticalListSortingStrategy}
						>
							{skill_items.map(item => (
								<MenuItem
									item={item}
									selected={selected_skill_id === item.id}
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

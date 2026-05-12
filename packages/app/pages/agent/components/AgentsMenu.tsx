import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import MenuItem from './MenuItem'

import type { DragEndEvent } from '@dnd-kit/core'

const Index = () => {
	const { agents, selected_agent_id, sortAgent } = useModel()
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
		<DndContext sensors={sensors} onDragEnd={onDragEnd}>
			<SortableContext items={agents.map(item => item.id)} strategy={verticalListSortingStrategy}>
				{agents.map(item => (
					<MenuItem item={item} selected={selected_agent_id === item.id} key={item.id}></MenuItem>
				))}
			</SortableContext>
		</DndContext>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

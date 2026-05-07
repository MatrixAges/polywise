import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import Col from './Col'
import Todo from './Todo'

const Index = () => {
	const { mode, kanban_data, drag_todo, onDragStart, onDragEnd, onDragCancel } = useModel()
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	return (
		<DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
			<div
				className={$cx(
					'flex flex-1',
					mode === 'kanban'
						? `
					overflow-x-scroll overflow-y-hidden
					min-w-0
					gap-5
					px-5 pt-1
				`
						: `
					overflow-y-scroll
					flex-col
					min-h-0
					px-6 py-3
				`
				)}
			>
				{Object.keys(kanban_data).map((key: string) => (
					<Col status={key} todos={kanban_data[key]} key={key}></Col>
				))}
			</div>
			<DragOverlay dropAnimation={null}>
				{drag_todo && (
					<div className='w-80'>
						<Todo item={drag_todo} index={-1} selected={false} overlay></Todo>
					</div>
				)}
			</DragOverlay>
		</DndContext>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

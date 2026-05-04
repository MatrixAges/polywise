import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import Col from './Col'

import type { Todo } from '@core/db'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

const Index = () => {
	const { mode, kanban_data, onDragStartTodo, onDragTodo } = useModel()
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const onDragStart = useMemoizedFn((_args: DragStartEvent) => {
		onDragStartTodo()
	})

	const onDragEnd = useMemoizedFn((args: DragEndEvent) => {
		onDragTodo(args)
	})

	return (
		<DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
			<div
				className={$cx(
					'flex flex-1',
					mode === 'kanban'
						? `
					overflow-x-scroll overflow-y-hidden
					min-w-0
					gap-5
					px-5 py-1
				`
						: `min-h-0 flex-col overflow-y-scroll`
				)}
			>
				{Object.keys(kanban_data).map((key: string) => (
					<Col status={key} todos={kanban_data[key] as Array<Todo>} key={key}></Col>
				))}
			</div>
		</DndContext>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { observer } from 'mobx-react-lite'

import { todo_status_icon_map } from '@/appdata'

import { useModel } from '../context'
import Todo from './Todo'

import type { RPCOutput } from '@/types'

interface IProps {
	status: string
	todos: RPCOutput['todo']['query'][keyof RPCOutput['todo']['query']]
}

const Index = (props: IProps) => {
	const { status, todos } = props
	const { mode, selected_todo_id } = useModel()
	const { Icon } = useMemo(() => todo_status_icon_map[status], [status])

	const { setNodeRef } = useDroppable({
		id: status,
		data: { type: 'col', status }
	})

	const items = useMemo(() => todos.map(item => item.todo.id), [todos])

	return (
		<div className={$cx('flex flex-col', mode === 'kanban' ? 'h-full w-80 shrink-0' : 'w-full')}>
			<div
				className={$cx(
					`
					flex
					items-center justify-between
					px-3
				`,
					mode === 'kanban' ? 'h-10' : 'bg-secondary/40 h-9'
				)}
			>
				<div className='text-std-400 flex items-center gap-2'>
					<Icon className='size-3.5'></Icon>
					<span
						className='
							mb-[-1.5px]
							text-sm font-medium
							uppercase
						'
					>
						{status}
					</span>
				</div>
				<span
					className='
						px-1 py-0.5
						rounded-full
						text-xs text-std-500 leading-none
						bg-secondary
						border border-border-light
					'
				>
					{todos.length}
				</span>
			</div>
			<div className={$cx('w-full flex-1', mode === 'kanban' && 'min-h-0 overflow-y-scroll')}>
				<SortableContext items={items} strategy={verticalListSortingStrategy}>
					<div
						className={$cx(
							'flex w-full flex-col',
							mode === 'kanban' && 'gap-3',
							todos.length === 0 && 'min-h-px'
						)}
						ref={setNodeRef}
					>
						{todos.map((item, index) => (
							<Todo
								item={item}
								index={index}
								selected={selected_todo_id === item.todo.id}
								key={item.todo.id}
							></Todo>
						))}
						{mode === 'kanban' && <span className='h-6'></span>}
					</div>
				</SortableContext>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

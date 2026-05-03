import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'

import { todo_status_icon_map } from '@/appdata'

import { useModel } from '../context'
import Todo from './Todo'

import type { Todo as TodoType } from '@core/db'

interface IProps {
	status: string
	todos: Array<TodoType>
}

const Index = (props: IProps) => {
	const { status, todos } = props
	const { mode, selected_todo_id } = useModel()
	const { Icon } = useMemo(() => todo_status_icon_map[status], [status])

	return (
		<div className={$cx('flex flex-col', mode === 'kanban' ? 'h-full w-80 shrink-0' : 'w-full')}>
			<div
				className={$cx(
					`
					flex
					items-center justify-between
					h-10
					px-3
				`,
					mode === 'kanban' ? '' : 'bg-secondary/40'
				)}
			>
				<div className='flex items-center gap-2'>
					<Icon className='stroke-std-500 size-3.5'></Icon>
					<span
						className='
							mb-[-1.5px]
							text-sm text-std-500 font-medium
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
						text-xs leading-none
						bg-secondary
						border border-border-light
					'
				>
					{todos.length}
				</span>
			</div>
			<div className={$cx('w-full flex-1', mode === 'kanban' && 'min-h-0 overflow-y-scroll')}>
				<div className={$cx('flex w-full flex-col', mode === 'kanban' && 'gap-3')}>
					{todos.map((item, index) => (
						<Todo
							item={item}
							index={index}
							selected={selected_todo_id === item.id}
							key={item.id}
						></Todo>
					))}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

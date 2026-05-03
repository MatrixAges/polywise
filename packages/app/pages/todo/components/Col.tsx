import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'

import { todo_status_icon_map } from '@/appdata'

import Todo from './Todo'

import type { TodoItem, TodoStatus } from '../types'

interface IProps {
	status: TodoStatus
	todos: Array<TodoItem>
}

const Index = (props: IProps) => {
	const { status, todos } = props

	const { Icon } = useMemo(() => todo_status_icon_map[status], [status])

	return (
		<div
			className='
				flex flex-col shrink-0
				w-80 h-full
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-10
					px-3
				'
			>
				<div className='flex items-center gap-2'>
					<Icon className='stroke-std-500 size-3.5'></Icon>
					<span className='mb-[-1.5px] text-sm font-medium uppercase'>{status}</span>
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
			<div className='min-h-0 w-full flex-1 overflow-y-scroll'>
				<div className='flex w-full flex-col gap-3'>
					{todos.map((item, index) => (
						<Todo item={item} index={index} key={item.id}></Todo>
					))}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

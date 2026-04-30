import { useMemoizedFn } from 'ahooks'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { useModel } from '../context'
import TodoItem from './TodoItem'

import type { IPropsStatusGroup } from '../types'

const Index = (props: IPropsStatusGroup) => {
	const { status, label, icon: Icon, color, todos, expanded } = props
	const { toggleStatusGroup, selected_todo_id } = useModel()

	const onToggle = useMemoizedFn(() => {
		toggleStatusGroup(status)
	})

	return (
		<div className='flex flex-col'>
			<div
				className='
					flex
					items-center
					gap-2
					px-2 py-1.5
					hover:bg-std-100
					cursor-pointer
				'
				onClick={onToggle}
			>
				{expanded ? (
					<ChevronDown size={14} className='text-std-400' />
				) : (
					<ChevronRight size={14} className='text-std-400' />
				)}
				<Icon size={14} className={color} />
				<span className='text-std-700 text-sm font-medium'>{label}</span>
				<span className='text-xsm text-std-400'>{todos.length}</span>
			</div>
			{expanded && (
				<div className='flex flex-col'>
					{todos.map(todo => (
						<TodoItem key={todo.id} item={todo} selected={todo.id === selected_todo_id} />
					))}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)

import { useMemoizedFn } from 'ahooks'
import { CheckCircle, Circle, Trash2 } from 'lucide-react'

import { useModel } from '../context'

import type { IPropsTodoItem } from '../types'

const Index = (props: IPropsTodoItem) => {
	const { item, selected } = props
	const { updateTodo, removeTodo, selectTodo } = useModel()

	const onToggleStatus = useMemoizedFn(() => {
		const new_status = item.status === 'done' ? 'pending' : 'done'

		updateTodo(item.id, { status: new_status })
	})

	const onRemove = useMemoizedFn(() => {
		removeTodo(item.id)
	})

	const onSelect = useMemoizedFn(() => {
		selectTodo(item.id)
	})

	return (
		<div
			className={$cx(
				`
				gap-2
				px-2 py-1.5
				group
				click_button
			`,
				selected && 'active'
			)}
			onClick={onSelect}
		>
			<div className='flex cursor-pointer items-center justify-center' onClick={onToggleStatus}>
				{item.status === 'done' ? (
					<CheckCircle size={14} className='text-green-500'></CheckCircle>
				) : (
					<Circle size={14} className='text-std-400'></Circle>
				)}
			</div>
			<span
				className={$cx(
					'flex-1 truncate text-sm',
					item.status === 'done' && 'text-std-400 line-through'
				)}
			>
				{item.title}
			</span>
			<div
				className='
					opacity-0
					group-hover:opacity-100
					icon_button small cursor-pointer
				'
				onClick={onRemove}
			>
				<Trash2 size={12}></Trash2>
			</div>
		</div>
	)
}

export default $app.memo(Index)

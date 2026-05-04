import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { fromNow } from '@/utils'

import { useModel } from '../context'

import type { Todo } from '@core/db'

interface IProps {
	item: Todo
	index: number
	selected: boolean
	overlay?: boolean
}

const Index = (props: IProps) => {
	const { item, index, selected, overlay = false } = props
	const { title, created_at } = item
	const { mode, setSelectTodo } = useModel()
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item.id,
		data: {
			type: 'todo',
			status: item.status,
			todo_id: item.id
		}
	})

	const onClick = useMemoizedFn(() => setSelectTodo(item.status, index))
	const style = overlay ? undefined : { transform: CSS.Translate.toString(transform), transition }
	const props_drag = overlay ? {} : { ...attributes, ...listeners }

	return (
		<div
			className={$cx(
				`
				flex
				w-full
				gap-1
				px-3
				border-border-light
				transition-colors
				cursor-pointer
			`,
				mode === 'kanban' ? 'flex-col rounded-lg border py-2' : 'h-11 items-center border-b',
				selected && 'border-primary/40',
				(isDragging || overlay) && 'z-10 opacity-70 shadow-lg'
			)}
			onClick={overlay ? undefined : onClick}
			ref={overlay ? undefined : setNodeRef}
			style={style}
			{...props_drag}
		>
			<span
				className={$cx(
					`
					text-std-600 text-sb font-medium leading-5.5!
				`,
					mode === 'kanban' ? 'w-full' : 'flex-1 truncate'
				)}
			>
				{title}
			</span>
			<span className='text-std-400 mt-0.5 text-sm'>{fromNow(created_at)}</span>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

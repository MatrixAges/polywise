import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { todo_priority_icon_map } from '@/appdata'
import { ArrowLeft, Grip } from '@/components/animate'
import { fromNow } from '@/utils'

import { useModel } from '../context'
import { useRuningTime } from '../hooks'

import type { RPCOutput } from '@/types'

interface IProps {
	item: RPCOutput['todo']['query'][keyof RPCOutput['todo']['query']][number]
	index: number
	selected: boolean
	overlay?: boolean
}

const Index = (props: IProps) => {
	const { item, index, selected, overlay = false } = props
	const { title, status, created_at, priority } = item.todo
	const { is_runing, unread, running_since } = item.session || {}

	const { mode, setSelectTodo } = useModel()

	const running_time = useRuningTime(running_since)

	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item.todo.id,
		data: { type: 'todo', status, index }
	})

	const onClick = useMemoizedFn(() => setSelectTodo(item.todo.status, index))

	const style = overlay ? undefined : { transform: CSS.Translate.toString(transform), transition }
	const props_drag = overlay ? {} : { ...attributes, ...listeners }

	const Status = useMemo(() => {
		if (is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='text-std-300! size-3' />

		return null
	}, [is_runing, unread])

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
				isDragging && 'opacity-0',
				(isDragging || overlay) && 'border-primary/40 z-10 backdrop-blur-lg'
			)}
			onClick={overlay ? undefined : onClick}
			ref={overlay ? undefined : setNodeRef}
			style={style}
			{...props_drag}
		>
			<div className={$cx('flex flex-1 gap-2', mode === 'kanban' ? 'items-start' : 'items-center')}>
				{mode === 'list' && (
					<span className='text-xsm text-std-400 w-12 uppercase'>
						{status.substring(0, 3)}-{index + 1}
					</span>
				)}
				<span
					className={$cx(
						'text-std-600 text-sb leading-5.5! font-medium',
						mode === 'kanban' ? 'w-full' : 'truncate'
					)}
				>
					{title}
				</span>
				{priority && priority !== 'none' && (
					<span
						className={$cx(
							`
							px-2 py-1
							rounded-full
							text-[10px] font-semibold leading-none
							uppercase
						`,
							mode === 'kanban' ? 'mr-[-2]' : 'mr-2',
							todo_priority_icon_map[priority]
						)}
					>
						{priority}
					</span>
				)}
			</div>
			<span className='text-std-400 mt-0.5 text-sm'>{fromNow(created_at)}</span>
			{item.session && (
				<div
					className='
						flex
						items-center
						gap-2
						px-2 py-1
						my-1
						rounded-full
						text-std-400 text-xs
						bg-secondary/60
					'
				>
					<span className='truncate'>{item.session.title}</span>
					{Status}
					{running_time && <span className='text-nowrap'>{running_time}</span>}
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

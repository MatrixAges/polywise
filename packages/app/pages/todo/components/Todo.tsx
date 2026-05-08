import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'
import { MessageSquareText } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { todo_priority_icon_map } from '@/appdata'
import { ArrowLeft, Grip } from '@/components/animate'
import { fromNow } from '@/utils'

import { useModel } from '../context'
import { useAutoFocus, useRuningTime } from '../hooks'

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
	const { is_runing, unread, running_since, running_done, report } = item.session || {}

	const { mode, detail_todo, setSelectTodo } = useModel()

	const running_time = useRuningTime(is_runing!, running_since, running_done)
	const ref_todo = useAutoFocus({ selected, status: detail_todo?.status, overlay })

	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item.todo.id,
		data: { type: 'todo', status, index }
	})

	const onClick = useMemoizedFn(() => setSelectTodo(item.todo.status, index))

	const set_ref = useMemoizedFn((node: HTMLDivElement | null) => {
		ref_todo.current = node
		setNodeRef(node)
	})

	const style = overlay ? undefined : { transform: CSS.Translate.toString(transform), transition }
	const props_drag = overlay ? {} : { ...attributes, ...listeners }

	const Status = useMemo(() => {
		if (is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='text-std-300! size-3' />

		return null
	}, [is_runing, unread])

	const Time = (
		<span
			className='
				text-std-400 text-xs text-nowrap
				group-data-[mode=list]:w-[80px] group-data-[mode=list]:truncate
			'
		>
			{fromNow(created_at)}
		</span>
	)

	return (
		<div
			className={$cx(
				`
				flex
				w-full
				gap-2
				border-border-light
				transition-colors
				group
				cursor-pointer
			`,
				mode === 'kanban'
					? `
				flex-col
				px-3 py-2
				rounded-lg
				border
			`
					: 'h-11 items-center border-b px-3',
				selected && 'border-primary/40',
				isDragging && 'opacity-0',
				(isDragging || overlay) && 'border-primary/40 z-10 backdrop-blur-lg'
			)}
			onClick={overlay ? undefined : onClick}
			ref={overlay ? undefined : set_ref}
			style={style}
			data-mode={mode}
			{...props_drag}
		>
			<div
				className='
					flex
					items-center justify-between
				'
			>
				<span
					className='
						w-12
						text-xsm text-std-400 font-medium
						uppercase
					'
				>
					{status.substring(0, 3)}-{index + 1}
				</span>
				{mode === 'kanban' && Time}
			</div>
			<div
				className={$cx(
					'flex flex-1 gap-2 truncate',
					mode === 'kanban' ? 'items-start' : 'items-center'
				)}
			>
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
			{item.session && (
				<div
					className={$cx(
						`
						flex
						items-center
						p-px
						rounded-full
						text-std-600 text-xs
						truncate
					`,
						mode === 'kanban' ? 'mb-1 gap-1' : 'gap-3'
					)}
				>
					<div
						className='
							flex
							items-center
							gap-1
						'
					>
						<MessageSquareText className='size-3'></MessageSquareText>
						<span className='flex-1 truncate group-data-[mode=list]:w-[180px]'>
							{report || item.session.title}
						</span>
					</div>
					{Status}
					{running_time && (
						<span className='text-std-400 text-nowrap group-data-[mode=list]:w-[36px]'>
							{running_time}
						</span>
					)}
				</div>
			)}
			{mode === 'list' && Time}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

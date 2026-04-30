import { useMemoizedFn } from 'ahooks'
import { Calendar, CheckCircle, Circle, Clock3, Trash2 } from 'lucide-react'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'
import TodoPriorityBadge from './TodoPriorityBadge'
import TodoStatusBadge from './TodoStatusBadge'

import type { MouseEvent } from 'react'
import type { IPropsTodoItem } from '../types'

const Index = (props: IPropsTodoItem) => {
	const { item, selected } = props
	const { updateTodo, removeTodo, selectTodo, formatDueAt, formatEstimate } = useModel()
	const due_at_label = formatDueAt(item.due_at)
	const estimate_label = formatEstimate(item.estimate)
	const summary = item.description || item.detail || ''

	const onToggleStatus = useMemoizedFn((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		const new_status = item.status === 'done' ? 'pending' : 'done'

		updateTodo(item.id, { status: new_status })
	})

	const onRemove = useMemoizedFn((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		removeTodo(item.id)
	})

	const onSelect = useMemoizedFn(() => {
		selectTodo(item.id)
	})

	return (
		<div
			className={$cx(
				`
				flex
				items-start
				gap-3
				px-3 py-3
				rounded-2xl
				border
				transition-colors
				group
			`,
				selected
					? 'border-primary/20 bg-primary/5'
					: 'bg-background/60 hover:border-border/60 hover:bg-background border-transparent'
			)}
			onClick={onSelect}
		>
			<Button variant='ghost' size='icon-xs' className='mt-0.5 rounded-full' onClick={onToggleStatus}>
				{item.status === 'done' ? (
					<CheckCircle size={14} className='text-emerald-500'></CheckCircle>
				) : (
					<Circle size={14} className='text-muted-foreground'></Circle>
				)}
			</Button>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					gap-2
				'
			>
				<div className='flex items-start gap-3'>
					<div className='min-w-0 flex-1'>
						<div
							className={$cx(
								'text-foreground truncate text-sm font-medium',
								item.status === 'done' && 'text-muted-foreground line-through'
							)}
						>
							{item.title}
						</div>
						{summary && (
							<div className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
								{summary}
							</div>
						)}
					</div>
					<TodoStatusBadge status={item.status}></TodoStatusBadge>
				</div>
				<div className='flex flex-wrap items-center gap-2'>
					<TodoPriorityBadge priority={item.priority}></TodoPriorityBadge>
					{estimate_label && (
						<Badge
							variant='outline'
							className='
								gap-1.5
								px-2.5 py-1
								rounded-full
								text-[11px]
							'
						>
							<Clock3 size={12}></Clock3>
							{estimate_label}
						</Badge>
					)}
					{due_at_label && (
						<Badge
							variant='outline'
							className='
								gap-1.5
								px-2.5 py-1
								rounded-full
								text-[11px]
							'
						>
							<Calendar size={12}></Calendar>
							{due_at_label}
						</Badge>
					)}
				</div>
			</div>
			<Button
				variant='ghost'
				size='icon-xs'
				className={$cx(
					'rounded-full opacity-0 transition-opacity group-hover:opacity-100',
					selected && 'opacity-100'
				)}
				onClick={onRemove}
			>
				<Trash2 size={12}></Trash2>
			</Button>
		</div>
	)
}

export default $app.memo(Index)

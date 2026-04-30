import { useMemoizedFn } from 'ahooks'
import { X } from 'lucide-react'

import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'
import TodoDetailDescription from './TodoDetailDescription'
import TodoDetailFields from './TodoDetailFields'
import TodoPriorityBadge from './TodoPriorityBadge'
import TodoStatusBadge from './TodoStatusBadge'

const Index = () => {
	const { selected_todo, closeDetailPanel } = useModel()

	if (!selected_todo) return null

	const onClose = useMemoizedFn(() => {
		closeDetailPanel()
	})

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[380px] h-full
				bg-secondary/15
				border-l border-border/60
			'
		>
			<div
				className='
					px-5 py-4
					border-b border-border/60
				'
			>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0 flex-1'>
						<div
							className='
								text-[11px] text-muted-foreground font-medium tracking-[0.16em]
								uppercase
							'
						>
							Inspector
						</div>
						<div
							className='
								mt-3
								text-lg text-foreground font-semibold tracking-tight
								truncate
							'
						>
							{selected_todo.title}
						</div>
						<div
							className='
								flex flex-wrap
								items-center
								gap-2
								mt-3
							'
						>
							<TodoStatusBadge status={selected_todo.status}></TodoStatusBadge>
							<TodoPriorityBadge priority={selected_todo.priority}></TodoPriorityBadge>
						</div>
					</div>
					<Button variant='ghost' size='icon-xs' className='rounded-full' onClick={onClose}>
						<X size={14}></X>
					</Button>
				</div>
			</div>
			<div className='flex-1 overflow-y-auto'>
				<div
					className='
						flex flex-col
						gap-5
						px-5 py-5
					'
				>
					<TodoDetailFields todo={selected_todo} />
					<TodoDetailDescription todo={selected_todo} />
				</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

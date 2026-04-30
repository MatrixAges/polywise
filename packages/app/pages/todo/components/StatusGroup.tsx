import { useMemoizedFn } from 'ahooks'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/__shadcn__/components/ui/collapsible'

import { useModel } from '../context'
import TodoItem from './TodoItem'

import type { IPropsStatusGroup } from '../types'

const Index = (props: IPropsStatusGroup) => {
	const { status, label, icon: Icon, color, todos, expanded } = props
	const { toggleStatusGroup, selected_todo_id } = useModel()

	const onOpenChange = useMemoizedFn(() => {
		toggleStatusGroup(status)
	})

	return (
		<Collapsible open={expanded} onOpenChange={onOpenChange}>
			<div className='border-border/60 bg-secondary/10 rounded-3xl border'>
				<CollapsibleTrigger
					className='
						flex
						items-center
						w-full
						gap-3
						px-4 py-3
						text-left
						transition-colors
						hover:bg-secondary/50
					'
				>
					{expanded ? (
						<ChevronDown size={14} className='text-muted-foreground' />
					) : (
						<ChevronRight size={14} className='text-muted-foreground' />
					)}
					<div
						className='
							flex
							items-center justify-center
							size-8
							rounded-full
							bg-background
						'
					>
						<Icon size={14} className={color}></Icon>
					</div>
					<div className='min-w-0 flex-1'>
						<div className='text-foreground text-sm font-medium'>{label}</div>
					</div>
					<Badge variant='outline' className='rounded-full px-2 py-0.5 text-[11px]'>
						{todos.length}
					</Badge>
				</CollapsibleTrigger>
				<CollapsibleContent className='px-2 pb-2'>
					<div className='flex flex-col gap-1 pt-1'>
						{todos.map(todo => (
							<TodoItem key={todo.id} item={todo} selected={todo.id === selected_todo_id} />
						))}
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	)
}

export default $app.memo(Index)

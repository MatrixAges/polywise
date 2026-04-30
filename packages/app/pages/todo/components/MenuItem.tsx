import { useMemoizedFn } from 'ahooks'
import { FolderKanban, Inbox } from 'lucide-react'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'

import type { IPropsMenuItem } from '../types'

const Index = (props: IPropsMenuItem) => {
	const { type, project, selected, count } = props
	const { setFilter, setSelectedProject } = useModel()
	const title = type === 'all' ? 'Inbox' : project?.name || 'Project'
	const subtitle = type === 'all' ? 'Standalone tasks' : 'Project scope'
	const Icon = type === 'all' ? Inbox : FolderKanban

	const onClick = useMemoizedFn(() => {
		if (type === 'all') {
			setFilter('all')
		} else if (project) {
			setSelectedProject(project.id)
		}
	})

	return (
		<Button
			variant={selected ? 'secondary' : 'ghost'}
			className='
				justify-start
				w-full h-auto
				px-3 py-2.5
				rounded-2xl
			'
			onClick={onClick}
		>
			<div className='flex w-full items-center gap-3'>
				<div
					className={$cx(
						`
						flex shrink-0
						items-center justify-center
						size-8
						rounded-full
						text-muted-foreground
						bg-background/80
					`,
						selected && 'bg-background text-foreground'
					)}
				>
					<Icon size={14}></Icon>
				</div>
				<div
					className='
						flex flex-1 flex-col
						items-start
						min-w-0
						gap-0.5
						text-left
					'
				>
					<span
						className='
							w-full
							text-sm text-foreground font-medium
							truncate
						'
					>
						{title}
					</span>
					<span className='text-muted-foreground text-xs'>{subtitle}</span>
				</div>
				<Badge variant='outline' className='rounded-full px-2 py-0.5 text-[11px]'>
					{count}
				</Badge>
			</div>
		</Button>
	)
}

export default $app.memo(Index)

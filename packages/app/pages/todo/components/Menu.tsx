import { observer } from 'mobx-react-lite'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Separator } from '@/__shadcn__/components/ui/separator'

import { useModel } from '../context'
import MenuItem from './MenuItem'

const Index = () => {
	const { selected_filter, selected_project_id, projects, all_todo_count, getProjectTodoCount } = useModel()

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[236px] h-full
				bg-secondary/10
				border-r border-border/60
			'
		>
			<div
				className='
					flex
					items-start justify-between
					px-4 py-4
				'
			>
				<div
					className='
						flex flex-col
						gap-1
					'
				>
					<span
						className='
							text-[11px] text-muted-foreground font-medium tracking-[0.16em]
							uppercase
						'
					>
						Workspace
					</span>
					<span className='text-foreground text-sm font-semibold tracking-tight'>Todos</span>
				</div>
				<Badge variant='outline' className='rounded-full px-2.5 py-1 text-[11px]'>
					{all_todo_count}
				</Badge>
			</div>
			<Separator></Separator>
			<div
				className='
					overflow-y-auto
					flex flex-1
					w-full
					min-h-0
				'
			>
				<div
					className='
						flex flex-col
						w-full
						gap-5
						px-2.5 py-3
					'
				>
					<div className='flex flex-col gap-1'>
						<div
							className='
								px-2
								text-[11px] text-muted-foreground font-medium tracking-[0.16em]
								uppercase
							'
						>
							Views
						</div>
						<MenuItem
							type='all'
							selected={selected_filter === 'all'}
							count={all_todo_count}
						></MenuItem>
					</div>
					<div className='flex flex-col gap-1'>
						<div
							className='
								px-2
								text-[11px] text-muted-foreground font-medium tracking-[0.16em]
								uppercase
							'
						>
							Projects
						</div>
						{projects.map(project => (
							<MenuItem
								key={project.id}
								type='project'
								project={project}
								selected={
									selected_filter === 'project' &&
									selected_project_id === project.id
								}
								count={getProjectTodoCount(project.id)}
							></MenuItem>
						))}
						{projects.length === 0 && (
							<div className='text-muted-foreground px-2 pt-2 text-sm'>
								No linked projects yet.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

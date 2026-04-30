import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import { useModel } from '../context'
import StatusGroup from './StatusGroup'

import type { KeyboardEvent } from 'react'

const Index = () => {
	const {
		current_title,
		current_todos,
		grouped_todos,
		status_configs,
		expanded_statuses,
		createTodo,
		selected_filter
	} = useModel()
	const [input_value, setInputValue] = useState('')
	const section_label = selected_filter === 'all' ? 'Inbox' : 'Project'
	const section_desc =
		selected_filter === 'all'
			? 'Capture personal execution work before it turns into noise.'
			: 'Track project execution in clear, status-driven groups.'

	const onCreateTodo = useMemoizedFn(async () => {
		if (!input_value.trim()) return

		await createTodo(input_value)
		setInputValue('')
	})

	const onKeyDown = useMemoizedFn((event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault()
			onCreateTodo()
		}
	})

	return (
		<div
			className='
				flex flex-1 flex-col
				min-w-0
				bg-background
			'
		>
			<div
				className='
					border-b border-border/60
				'
			>
				<div
					className='
						flex
						items-start justify-between
						gap-4
						px-6 py-5
					'
				>
					<div className='flex min-w-0 flex-col gap-1'>
						<span
							className='
								text-[11px] text-muted-foreground font-medium tracking-[0.16em]
								uppercase
							'
						>
							{section_label}
						</span>
						<span
							className='
								text-2xl text-foreground font-semibold tracking-tight
								truncate
							'
						>
							{current_title}
						</span>
						<p className='text-muted-foreground text-sm'>{section_desc}</p>
					</div>
					<Badge variant='outline' className='rounded-full px-3 py-1 text-xs'>
						{current_todos.length} tasks
					</Badge>
				</div>
			</div>
			<div className='flex-1 overflow-y-auto'>
				<div
					className='
						flex flex-col
						w-full max-w-4xl
						gap-5
						px-6 py-6
						mx-auto
					'
				>
					<div
						className='
							p-3
							rounded-3xl
							bg-secondary/20
							border border-border/60
						'
					>
						<div className='flex items-center gap-3'>
							<Input
								className='bg-background/90 h-10 rounded-2xl'
								placeholder='Create a task...'
								value={input_value}
								onChange={event => setInputValue(event.target.value)}
								onKeyDown={onKeyDown}
							></Input>
							<Button
								size='sm'
								className='rounded-2xl px-4'
								onClick={onCreateTodo}
								disabled={!input_value.trim()}
							>
								<Plus size={14}></Plus>
								New
							</Button>
						</div>
					</div>
					<div className='flex flex-col gap-3'>
						{status_configs.map(config => {
							const todos = grouped_todos.get(config.key) || []

							if (todos.length === 0) return null

							return (
								<StatusGroup
									key={config.key}
									status={config.key}
									label={config.label}
									icon={config.icon}
									color={config.color}
									todos={todos}
									expanded={expanded_statuses.has(config.key)}
								/>
							)
						})}
						{current_todos.length === 0 && (
							<div
								className='
									px-6 py-12
									rounded-3xl
									text-center
									bg-secondary/10
									border border-dashed border-border/60
								'
							>
								<div
									className='
										flex
										items-center justify-center
										size-11
										mx-auto
										mb-3
										rounded-full
										text-muted-foreground
										bg-background
									'
								>
									<Plus size={16}></Plus>
								</div>
								<div className='text-foreground text-base font-medium'>
									No tasks in this view.
								</div>
								<div className='text-muted-foreground mt-1 text-sm'>
									Start with a concise title and refine it from the inspector.
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

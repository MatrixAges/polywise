import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import StatusGroup from './StatusGroup'

const Index = () => {
	const { current_title, current_todos, grouped_todos, status_configs, expanded_statuses, createTodo } = useModel()
	const [input_value, setInputValue] = useState('')

	const onCreateTodo = useMemoizedFn(async () => {
		if (!input_value.trim()) return

		await createTodo(input_value)
		setInputValue('')
	})

	const onKeyDown = useMemoizedFn((event: React.KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault()
			onCreateTodo()
		}
	})

	return (
		<div className='flex min-w-0 flex-1 flex-col'>
			<div
				className='
					flex
					items-center justify-between
					h-8
					px-3
					border-b border-border-light
				'
			>
				<span
					className='
						px-1 py-0.5
						text-xsm text-std-500 font-medium
					'
				>
					{current_title}
				</span>
				<span className='text-xsm text-std-400'>{current_todos.length} tasks</span>
			</div>
			<div className='flex-1 overflow-y-auto p-2'>
				<div className='mb-2 flex gap-2'>
					<input
						className='
							flex-1
							px-2 py-1
							rounded
							text-sm
							bg-transparent
							border border-border-light
						'
						placeholder='New task'
						value={input_value}
						onChange={event => setInputValue(event.target.value)}
						onKeyDown={onKeyDown}
					/>
					<button type='button' className='icon_button small' onClick={onCreateTodo}>
						<Plus size={14}></Plus>
					</button>
				</div>
				<div className='flex flex-col'>
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
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useState } from 'react'

import type { IProjectSerializedTodoItem } from '../../types'

interface IProps {
	project_id: string
	todos: Array<IProjectSerializedTodoItem>
	createTodo: (args: { project_id: string; title: string }) => Promise<void>
	renameTodo: (args: { project_id: string; todo_id: string; title: string }) => Promise<void>
	removeTodo: (args: { project_id: string; todo_id: string }) => Promise<void>
}

const Index = (props: IProps) => {
	const { project_id, todos, createTodo, renameTodo, removeTodo } = props
	const [value, setValue] = useState('')
	const [editing_id, setEditingId] = useState('')
	const [editing_value, setEditingValue] = useState('')

	return (
		<div className='flex flex-col gap-2'>
			<div className='text-std-400 text-xs font-medium'>Todos</div>
			<div className='flex gap-2'>
				<input
					className='
						w-full
						px-2 py-1
						rounded
						text-sm
						bg-transparent
						border border-border-light
					'
					placeholder='New todo'
					value={value}
					onChange={event => setValue(event.target.value)}
				/>
				<button
					type='button'
					className='click_button'
					onClick={async () => {
						if (!value.trim()) return

						await createTodo({ project_id, title: value.trim() })
						setValue('')
					}}
				>
					Add
				</button>
			</div>
			<div className='flex flex-col gap-1'>
				{todos.map(item => (
					<div
						key={item.id}
						className='
							flex
							items-center justify-between
							px-2 py-1
							rounded
							text-sm
							border border-border-light
						'
					>
						{editing_id === item.id ? (
							<input
								className='
									w-full
									px-2 py-1
									rounded
									text-sm
									bg-transparent
									border border-border-light
								'
								value={editing_value}
								onChange={event => setEditingValue(event.target.value)}
								onKeyDown={async event => {
									if (event.key === 'Enter' && editing_value.trim()) {
										await renameTodo({
											project_id,
											todo_id: item.id,
											title: editing_value.trim()
										})
										setEditingId('')
										setEditingValue('')
									}
								}}
							/>
						) : (
							<span>{item.title}</span>
						)}
						<div className='flex gap-2'>
							<button
								type='button'
								className='text-std-400 text-xs'
								onClick={() => {
									setEditingId(item.id)
									setEditingValue(item.title)
								}}
							>
								Rename
							</button>
							{editing_id === item.id && (
								<button
									type='button'
									className='text-std-400 text-xs'
									onClick={async () => {
										if (!editing_value.trim()) return

										await renameTodo({
											project_id,
											todo_id: item.id,
											title: editing_value.trim()
										})
										setEditingId('')
										setEditingValue('')
									}}
								>
									Save
								</button>
							)}
							<button
								type='button'
								className='text-std-400 text-xs'
								onClick={() => removeTodo({ project_id, todo_id: item.id })}
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)

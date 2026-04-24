import type { IProjectSerializedTodoItem } from '@core/rpc/project/types'

interface IProps {
	todos: Array<IProjectSerializedTodoItem>
	todo_input_value: string
	todo_editing_id: string
	todo_editing_value: string
	onChangeTodoInput: (value: string) => void
	onClickCreateTodo: () => Promise<void>
	onStartRenameTodo: (todo_id: string, title: string) => void
	onChangeEditingTodoValue: (value: string) => void
	onSubmitRenameTodo: (todo_id: string) => Promise<void>
	onCancelRenameTodo: () => void
	onClickRemoveTodo: (todo_id: string) => Promise<void>
}

const Index = (props: IProps) => {
	const {
		todos,
		todo_input_value,
		todo_editing_id,
		todo_editing_value,
		onChangeTodoInput,
		onClickCreateTodo,
		onStartRenameTodo,
		onChangeEditingTodoValue,
		onSubmitRenameTodo,
		onCancelRenameTodo,
		onClickRemoveTodo
	} = props

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
					value={todo_input_value}
					onChange={event => onChangeTodoInput(event.target.value)}
					onKeyDown={event => {
						if (event.key === 'Enter') {
							event.preventDefault()
							onClickCreateTodo()
						}
					}}
				/>
				<button
					type='button'
					className='click_button'
					onClick={() => {
						onClickCreateTodo()
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
						{todo_editing_id === item.id ? (
							<input
								className='
									w-full
									px-2 py-1
									rounded
									text-sm
									bg-transparent
									border border-border-light
								'
								value={todo_editing_value}
								onChange={event => onChangeEditingTodoValue(event.target.value)}
								onKeyDown={event => {
									if (event.key === 'Enter') {
										event.preventDefault()
										onSubmitRenameTodo(item.id)
									}

									if (event.key === 'Escape') {
										event.preventDefault()
										onCancelRenameTodo()
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
								onClick={() => onStartRenameTodo(item.id, item.title)}
							>
								Rename
							</button>
							{todo_editing_id === item.id && (
								<button
									type='button'
									className='text-std-400 text-xs'
									onClick={() => {
										onSubmitRenameTodo(item.id)
									}}
								>
									Save
								</button>
							)}
							<button
								type='button'
								className='text-std-400 text-xs'
								onClick={() => {
									onClickRemoveTodo(item.id)
								}}
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

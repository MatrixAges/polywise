type TodoItem = {
	id: string
	title: string
}

interface IProps {
	todos: Array<TodoItem>
	todoInputValue: string
	todoEditingId: string
	todoEditingValue: string
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
		todoInputValue,
		todoEditingId,
		todoEditingValue,
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
					value={todoInputValue}
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
						{todoEditingId === item.id ? (
							<input
								className='
									w-full
									px-2 py-1
									rounded
									text-sm
									bg-transparent
									border border-border-light
								'
								value={todoEditingValue}
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
							{todoEditingId === item.id && (
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

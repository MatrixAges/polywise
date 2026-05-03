import { useRef } from 'react'
import { observer } from 'mobx-react-lite'

import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { fromNow } from '@/utils'

import { useModel } from '../context'

import type { TodoItem } from '../types'

interface IProps {
	item: TodoItem
	index: number
}

const Index = (props: IProps) => {
	const { item } = props
	const { title, created_at } = item
	const {
		selected_todo_id,
		title_editing_todo_id,
		title_editing_value,
		selectTodo,
		startEditTitle,
		setTitleEditingValue,
		submitEditTitle,
		cancelEditTitle
	} = useModel()
	const ref_is_submitting = useRef(false)
	const is_selected = selected_todo_id === item.id
	const is_editing = title_editing_todo_id === item.id

	return (
		<div
			className={$cx(
				`
				flex flex-col
				w-full
				gap-1
				px-3 py-2
				rounded-lg
				border border-border-light
				transition-colors
				cursor-pointer
			`,
				is_selected && 'bg-secondary/60 border-primary/40'
			)}
			onClick={() => {
				selectTodo(item.id)
			}}
		>
			{is_editing ? (
				<Textarea
					className='
						h-auto!
						min-h-0!
						p-0
						rounded-none
						text-base! font-medium leading-5.5!
						bg-transparent
						border-none
						focus-within:ring-0!
					'
					value={title_editing_value}
					autoFocus
					onChange={event => setTitleEditingValue(event.target.value)}
					onBlur={async () => {
						if (ref_is_submitting.current) return

						ref_is_submitting.current = true

						await submitEditTitle(item.id)

						ref_is_submitting.current = false
					}}
					onKeyDown={async event => {
						if (event.key === 'Enter') {
							event.preventDefault()
							ref_is_submitting.current = true

							await submitEditTitle(item.id)

							ref_is_submitting.current = false

							return
						}

						if (event.key === 'Escape') {
							event.preventDefault()
							cancelEditTitle()
						}
					}}
				></Textarea>
			) : (
				<button
					type='button'
					className='
						w-full
						font-medium leading-5.5!
						text-left
						outline-none
					'
					onClick={() => {
						selectTodo(item.id)
					}}
					onDoubleClick={event => {
						event.stopPropagation()
						startEditTitle(item)
					}}
				>
					{title}
				</button>
			)}
			<span className='text-std-400 mt-0.5 text-sm'>{fromNow(created_at)}</span>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

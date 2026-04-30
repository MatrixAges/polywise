import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'

import { useModel } from '../context'

import type { IPropsTodoDetailDescription } from '../types'

const Index = (props: IPropsTodoDetailDescription) => {
	const { todo } = props
	const { updateTodoField } = useModel()
	const [description, setDescription] = useState(todo.description || '')
	const [detail, setDetail] = useState(todo.detail || '')

	const onDescriptionBlur = useMemoizedFn(() => {
		if (description !== (todo.description || '')) {
			updateTodoField(todo.id, 'description', description)
		}
	})

	const onDetailBlur = useMemoizedFn(() => {
		if (detail !== (todo.detail || '')) {
			updateTodoField(todo.id, 'detail', detail)
		}
	})

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-2'>
				<span className='text-xsm text-std-500 font-medium'>Description</span>
				<textarea
					className='
						min-h-[60px]
						px-2 py-1.5
						rounded
						text-sm
						bg-transparent
						border border-border-light
						resize-none
					'
					placeholder='Add a description...'
					value={description}
					onChange={e => setDescription(e.target.value)}
					onBlur={onDescriptionBlur}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<span className='text-xsm text-std-500 font-medium'>Details</span>
				<textarea
					className='
						min-h-[120px]
						px-2 py-1.5
						rounded
						text-sm
						bg-transparent
						border border-border-light
						resize-none
					'
					placeholder='Add detailed notes...'
					value={detail}
					onChange={e => setDetail(e.target.value)}
					onBlur={onDetailBlur}
				/>
			</div>
		</div>
	)
}

export default $app.memo(Index)

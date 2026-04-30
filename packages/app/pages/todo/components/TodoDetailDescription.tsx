import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'

import { Separator } from '@/__shadcn__/components/ui/separator'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import { useModel } from '../context'

import type { ChangeEvent } from 'react'
import type { IPropsTodoDetailDescription } from '../types'

const Index = (props: IPropsTodoDetailDescription) => {
	const { todo } = props
	const { updateTodoField } = useModel()
	const [description, setDescription] = useState(todo.description || '')
	const [detail, setDetail] = useState(todo.detail || '')

	useEffect(() => {
		setDescription(todo.description || '')
		setDetail(todo.detail || '')
	}, [todo.id, todo.description, todo.detail])

	const onDescriptionChange = useMemoizedFn((event: ChangeEvent<HTMLTextAreaElement>) => {
		setDescription(event.target.value)
	})

	const onDetailChange = useMemoizedFn((event: ChangeEvent<HTMLTextAreaElement>) => {
		setDetail(event.target.value)
	})

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
		<div
			className='
				p-4
				rounded-3xl
				bg-background/70
				border border-border/60
			'
		>
			<div className='text-foreground text-sm font-semibold tracking-tight'>Notes</div>
			<div className='mt-4 flex flex-col gap-4'>
				<div className='flex flex-col gap-2'>
					<span
						className='
							text-[11px] text-muted-foreground font-medium tracking-[0.16em]
							uppercase
						'
					>
						Description
					</span>
					<Textarea
						className='bg-background min-h-[96px] rounded-2xl'
						placeholder='Add a description...'
						value={description}
						onChange={onDescriptionChange}
						onBlur={onDescriptionBlur}
					></Textarea>
				</div>
				<Separator></Separator>
				<div className='flex flex-col gap-2'>
					<span
						className='
							text-[11px] text-muted-foreground font-medium tracking-[0.16em]
							uppercase
						'
					>
						Details
					</span>
					<Textarea
						className='bg-background min-h-[160px] rounded-2xl'
						placeholder='Add detailed notes...'
						value={detail}
						onChange={onDetailChange}
						onBlur={onDetailBlur}
					></Textarea>
				</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { CalendarDays, CircleDot, Flag, Ruler, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { Controller } from '@/components'
import { useForm } from '@/hooks'

import { useModel } from '../context'

import type { ITodoDetailForm, TodoPriority, TodoStatus } from '../types'

const todo_status_options: Array<{ label: string; value: TodoStatus }> = [
	{ label: 'Draft', value: 'draft' },
	{ label: 'Pending', value: 'pending' },
	{ label: 'Processing', value: 'processing' },
	{ label: 'Unreview', value: 'unreview' },
	{ label: 'Done', value: 'done' },
	{ label: 'Error', value: 'error' },
	{ label: 'Archive', value: 'archive' }
]

const todo_priority_options: Array<{ label: string; value: TodoPriority }> = [
	{ label: 'None', value: 'none' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'Urgent', value: 'urgent' }
]

const Index = () => {
	const {
		selected_todo,
		detail_form,
		detail_form_version,
		closeTodoDetail,
		setDetailForm,
		submitDetailForm,
		is_saving_detail
	} = useModel()

	const { control, register, handleSubmit, reset } = useForm<ITodoDetailForm>({ values: detail_form }, values =>
		setDetailForm(values)
	)

	useEffect(() => {
		reset(detail_form)
	}, [detail_form, detail_form_version, reset])

	const onSubmit = useMemoizedFn((values: ITodoDetailForm) => submitDetailForm(values))

	if (!selected_todo) return null

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[360px] h-full
				bg-background
				border-l border-border-light
			'
		>
			<div
				className='
					flex shrink-0
					items-center justify-between
					h-12
					px-4
					border-b border-border-light
				'
			>
				<div className='flex flex-col'>
					<span className='text-sm font-semibold'>Todo Detail</span>
					<span className='text-std-400 text-xs'>{selected_todo.id}</span>
				</div>
				<Button variant='ghost' className='size-8 rounded-full p-0' onClick={closeTodoDetail}>
					<X className='size-4'></X>
				</Button>
			</div>
			<div
				className='
					overflow-y-scroll
					flex-1
					min-h-0
					px-4 py-4
				'
			>
				<form className='flex flex-col gap-6' onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup className='gap-4'>
						<Field className='gap-2'>
							<FieldContent>
								<FieldTitle>Title</FieldTitle>
								<FieldDescription>
									Update the task title shown in the board
								</FieldDescription>
							</FieldContent>
							<Input {...register('title')}></Input>
						</Field>
						<Field className='gap-2'>
							<FieldContent>
								<FieldTitle>Description</FieldTitle>
								<FieldDescription>Add more context for this todo</FieldDescription>
							</FieldContent>
							<Textarea {...register('description')} className='min-h-32'></Textarea>
						</Field>
					</FieldGroup>
					<FieldGroup className='gap-4'>
						<Field className='gap-2'>
							<FieldContent>
								<FieldTitle className='gap-2'>
									<CircleDot className='size-4'></CircleDot>
									Status
								</FieldTitle>
							</FieldContent>
							<Controller name='status' control={control}>
								<Select items={todo_status_options}>
									<SelectTrigger className='w-full rounded-xl'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent align='start'>
										<SelectGroup>
											<SelectLabel>Status</SelectLabel>
											{todo_status_options.map(item => (
												<SelectItem value={item.value} key={item.value}>
													{item.label}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Controller>
						</Field>
						<Field className='gap-2'>
							<FieldContent>
								<FieldTitle className='gap-2'>
									<Flag className='size-4'></Flag>
									Priority
								</FieldTitle>
							</FieldContent>
							<Controller name='priority' control={control}>
								<Select items={todo_priority_options}>
									<SelectTrigger className='w-full rounded-xl'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent align='start'>
										<SelectGroup>
											<SelectLabel>Priority</SelectLabel>
											{todo_priority_options.map(item => (
												<SelectItem value={item.value} key={item.value}>
													{item.label}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Controller>
						</Field>
						<Field className='gap-2'>
							<FieldContent>
								<FieldTitle className='gap-2'>
									<Ruler className='size-4'></Ruler>
									Estimate
								</FieldTitle>
								<FieldDescription>
									Use a number when the task has a known estimate
								</FieldDescription>
							</FieldContent>
							<Input
								type='number'
								{...register('estimate', {
									setValueAs: value => {
										if (value === '') return ''

										return Number(value)
									}
								})}
							></Input>
						</Field>
						<Field className='gap-2'>
							<FieldContent>
								<FieldTitle className='gap-2'>
									<CalendarDays className='size-4'></CalendarDays>
									Due Date
								</FieldTitle>
							</FieldContent>
							<Input type='date' {...register('due_at')}></Input>
						</Field>
					</FieldGroup>
					<div className='flex justify-end gap-2'>
						<Button type='button' variant='outline' onClick={() => reset(detail_form)}>
							Reset
						</Button>
						<Button type='submit' disabled={is_saving_detail}>
							{is_saving_detail ? 'Saving...' : 'Save'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

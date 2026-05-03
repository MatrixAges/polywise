import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { CalendarDays, CircleDot, Flag, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
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
				w-[300px] h-full
				bg-background
				border-l border-border-light
			'
		>
			<div
				className='
					flex shrink-0
					items-center justify-between
					h-8
					px-3
					border-b border-border-light
				'
			>
				<span className='text-std-4s00 text-sm font-semibold'>Todo Detail</span>
				<button className='icon_button small mr-[-2px]' onClick={closeTodoDetail}>
					<X></X>
				</button>
			</div>
			<div
				className='
					overflow-y-scroll
					flex-1
					min-h-0
					px-4 py-3
				'
			>
				<form className='flex flex-col' onSubmit={handleSubmit(onSubmit)}>
					<Textarea
						className='
							h-auto!
							min-h-0!
							p-0
							mb-3
							rounded-none
							text-base! font-medium leading-6!
							bg-transparent
							border-none
							focus-within:ring-0!
						'
						{...register('title')}
					></Textarea>
					<div className='flex flex-col gap-1'>
						<div className='flex items-center justify-between'>
							<div className='text-std-400 flex items-center gap-2'>
								<CircleDot className='size-3'></CircleDot>
								<span className='text-sm font-medium'>Status</span>
							</div>
							<Controller name='status' control={control}>
								<Select items={todo_status_options}>
									<SelectTrigger className='bg-transparent' no_active_style>
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
						</div>
						<div className='flex items-center justify-between'>
							<div className='text-std-400 flex items-center gap-2'>
								<Flag className='size-3'></Flag>
								<span className='text-sm font-medium'>Priority</span>
							</div>
							<Controller name='priority' control={control}>
								<Select items={todo_priority_options}>
									<SelectTrigger className='bg-transparent' no_active_style>
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
						</div>
						<div className='border-border-light mt-2 w-full border-b'></div>
						<Textarea
							className='
								min-h-32
								px-0
								bg-transparent
								border-none
								focus-within:ring-0!
							'
							{...register('description')}
							placeholder='Add description'
						></Textarea>
					</div>
				</form>
			</div>
			<div
				className='
					flex
					justify-end
					gap-2
					p-3
				'
			>
				<Button type='button' variant='outline' onClick={() => reset(detail_form)}>
					Reset
				</Button>
				<Button type='submit' disabled={is_saving_detail}>
					{is_saving_detail ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

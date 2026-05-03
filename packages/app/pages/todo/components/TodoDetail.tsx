import { useEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'
import { CircleDot, Flag, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Controller } from 'react-hook-form'

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
	const { selected_todo, detail_form, detail_form_version, closeTodoDetail, setDetailForm, submitDetailForm } =
		useModel()

	const { control, register, handleSubmit, reset } = useForm<ITodoDetailForm>({ values: detail_form }, values =>
		setDetailForm(values)
	)
	const ref_is_composing = useRef(false)

	useEffect(() => {
		reset(detail_form)
	}, [detail_form, detail_form_version, reset])

	const onSubmit = useMemoizedFn((values: ITodoDetailForm) => submitDetailForm(values))
	const submitForm = useMemoizedFn(() => handleSubmit(onSubmit)())
	const register_title = register('title')
	const register_description = register('description')

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
				<form className='flex flex-col'>
					<Textarea
						className='
							h-auto!
							min-h-0!
							p-0
							mb-3
							rounded-none
							text-base! font-medium leading-5.5!
							bg-transparent
							border-none
							focus-within:ring-0!
						'
						{...register_title}
						onChange={event => {
							register_title.onChange(event)
						}}
						onCompositionStart={() => {
							ref_is_composing.current = true
						}}
						onCompositionEnd={() => {
							ref_is_composing.current = false
						}}
						onBlur={event => {
							register_title.onBlur(event)

							if (ref_is_composing.current) return

							submitForm()
						}}
					></Textarea>
					<div className='flex flex-col gap-1'>
						<div className='flex items-center justify-between'>
							<div className='text-std-400 flex items-center gap-2'>
								<CircleDot className='size-3'></CircleDot>
								<span className='text-sm font-medium'>Status</span>
							</div>
							<Controller
								name='status'
								control={control}
								render={({ field }) => (
									<Select
										items={todo_status_options}
										name={field.name}
										value={field.value}
										onValueChange={value => {
											field.onChange(value)
											submitForm()
										}}
									>
										<SelectTrigger
											className='text-std-500 bg-transparent font-semibold'
											no_active_style
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent align='start'>
											<SelectGroup>
												<SelectLabel>Status</SelectLabel>
												{todo_status_options.map(item => (
													<SelectItem
														value={item.value}
														key={item.value}
													>
														{item.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
						<div className='flex items-center justify-between'>
							<div className='text-std-400 flex items-center gap-2'>
								<Flag className='size-3'></Flag>
								<span className='text-sm font-medium'>Priority</span>
							</div>
							<Controller
								name='priority'
								control={control}
								render={({ field }) => (
									<Select
										items={todo_priority_options}
										name={field.name}
										value={field.value}
										onValueChange={value => {
											field.onChange(value)
											submitForm()
										}}
									>
										<SelectTrigger
											className='text-std-500 bg-transparent font-semibold'
											no_active_style
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent align='start'>
											<SelectGroup>
												<SelectLabel>Priority</SelectLabel>
												{todo_priority_options.map(item => (
													<SelectItem
														value={item.value}
														key={item.value}
													>
														{item.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								)}
							/>
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
							{...register_description}
							onChange={event => {
								register_description.onChange(event)
							}}
							onCompositionStart={() => {
								ref_is_composing.current = true
							}}
							onCompositionEnd={() => {
								ref_is_composing.current = false
							}}
							onBlur={event => {
								register_description.onBlur(event)

								if (ref_is_composing.current) return

								submitForm()
							}}
							placeholder='Add description'
						></Textarea>
					</div>
				</form>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

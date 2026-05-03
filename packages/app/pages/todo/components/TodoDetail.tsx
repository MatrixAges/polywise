import { useEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'
import { debounce } from 'es-toolkit'
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

import type { RPCInput } from '@/types'
import type { Todo } from '@core/db'

const todo_status_options: Array<{ label: string; value: string }> = [
	{ label: 'Draft', value: 'draft' },
	{ label: 'Pending', value: 'pending' },
	{ label: 'Processing', value: 'processing' },
	{ label: 'Unreview', value: 'unreview' },
	{ label: 'Done', value: 'done' },
	{ label: 'Error', value: 'error' },
	{ label: 'Archive', value: 'archive' }
]

const todo_priority_options: Array<{ label: string; value: string }> = [
	{ label: 'None', value: 'none' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'Urgent', value: 'urgent' }
]

const Index = () => {
	const { detail_todo, updateTodo, closeTodoDetail } = useModel()

	const { control, register, reset } = useForm<Todo>({ values: $copy(detail_todo) }, (_, v) => {
		updateTodo(v as RPCInput['todo']['update'])
	})
	const ref_is_composing = useRef(false)

	useEffect(() => {
		reset(detail_todo)
	}, [detail_todo])

	const register_title = register('title')
	const register_description = register('description')

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[320px] h-full
				bg-background
				border-l border-border-light
			'
		>
			<div
				className='
					flex shrink-0
					items-center justify-between
					px-4 pt-2.5
					pb-2
				'
			>
				<span className='text-std-400 text-sm font-medium'>Todo Detail</span>
				<button className='icon_button small mr-[-2px]' onClick={closeTodoDetail}>
					<X></X>
				</button>
			</div>
			<div
				className='
					overflow-y-scroll
					flex-1
					min-h-0
					px-4
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
						onChange={debounce(register_title.onChange, 450)}
						onCompositionStart={() => {
							ref_is_composing.current = true
						}}
						onCompositionEnd={() => {
							ref_is_composing.current = false
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
										onValueChange={field.onChange}
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
										onValueChange={field.onChange}
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
							onChange={debounce(register_title.onChange, 450)}
							onCompositionStart={() => {
								ref_is_composing.current = true
							}}
							onCompositionEnd={() => {
								ref_is_composing.current = false
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

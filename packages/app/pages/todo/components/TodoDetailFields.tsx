import { useMemoizedFn } from 'ahooks'
import { BadgeAlert, Calendar, Clock, Flag } from 'lucide-react'

import { FieldGroup } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'

import { useModel } from '../context'
import TodoDetailField from './TodoDetailField'

import type { ChangeEvent } from 'react'
import type { IPropsTodoDetailFields } from '../types'

const Index = (props: IPropsTodoDetailFields) => {
	const { todo } = props
	const { updateTodoField, status_configs, priority_configs } = useModel()

	const onStatusChange = useMemoizedFn((value: string) => {
		updateTodoField(todo.id, 'status', value)
	})

	const onPriorityChange = useMemoizedFn((value: string) => {
		updateTodoField(todo.id, 'priority', value === 'none' ? null : value)
	})

	const onEstimateChange = useMemoizedFn((event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value ? Number(event.target.value) : null

		updateTodoField(todo.id, 'estimate', value)
	})

	const onDueAtChange = useMemoizedFn((event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value ? new Date(event.target.value) : null

		updateTodoField(todo.id, 'due_at', value)
	})

	const formatDate = (date: Date | null | undefined) => {
		if (!date) return ''

		return new Date(date).toISOString().split('T')[0]
	}

	return (
		<div
			className='
				p-4
				rounded-3xl
				bg-background/70
				border border-border/60
			'
		>
			<div
				className='
					mb-4
					text-sm text-foreground font-semibold tracking-tight
				'
			>
				Properties
			</div>
			<FieldGroup className='gap-4'>
				<TodoDetailField icon={BadgeAlert} label='Status'>
					<Select value={todo.status} onValueChange={onStatusChange}>
						<SelectTrigger className='bg-background w-full rounded-2xl'>
							<SelectValue></SelectValue>
						</SelectTrigger>
						<SelectContent align='start'>
							<SelectGroup>
								{status_configs.map(config => (
									<SelectItem key={config.key} value={config.key}>
										{config.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</TodoDetailField>
				<TodoDetailField icon={Flag} label='Priority'>
					<Select value={todo.priority || 'none'} onValueChange={onPriorityChange}>
						<SelectTrigger className='bg-background w-full rounded-2xl'>
							<SelectValue></SelectValue>
						</SelectTrigger>
						<SelectContent align='start'>
							<SelectGroup>
								<SelectItem value='none'>None</SelectItem>
								{priority_configs.map(config => (
									<SelectItem key={config.key} value={config.key}>
										{config.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</TodoDetailField>
				<TodoDetailField icon={Clock} label='Estimate'>
					<Input
						className='bg-background rounded-2xl'
						type='number'
						placeholder='Minutes'
						value={todo.estimate ?? ''}
						onChange={onEstimateChange}
					></Input>
				</TodoDetailField>
				<TodoDetailField icon={Calendar} label='Due Date'>
					<Input
						className='bg-background rounded-2xl'
						type='date'
						value={formatDate(todo.due_at)}
						onChange={onDueAtChange}
					></Input>
				</TodoDetailField>
			</FieldGroup>
		</div>
	)
}

export default $app.memo(Index)

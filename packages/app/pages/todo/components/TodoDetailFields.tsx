import { useMemoizedFn } from 'ahooks'
import { BadgeAlert, Calendar, Clock, Flag } from 'lucide-react'

import { useModel } from '../context'

import type { IPropsTodoDetailFields } from '../types'

const Index = (props: IPropsTodoDetailFields) => {
	const { todo } = props
	const { updateTodoField, status_configs } = useModel()

	const onStatusChange = useMemoizedFn((e: React.ChangeEvent<HTMLSelectElement>) => {
		updateTodoField(todo.id, 'status', e.target.value)
	})

	const onPriorityChange = useMemoizedFn((e: React.ChangeEvent<HTMLSelectElement>) => {
		updateTodoField(todo.id, 'priority', e.target.value)
	})

	const onEstimateChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value ? parseInt(e.target.value) : null

		updateTodoField(todo.id, 'estimate', value)
	})

	const onDueAtChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value ? new Date(e.target.value) : null

		updateTodoField(todo.id, 'due_at', value)
	})

	const format_date = (date: Date | null | undefined) => {
		if (!date) return ''

		return new Date(date).toISOString().split('T')[0]
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center gap-3'>
				<div className='flex w-24 items-center gap-2'>
					<BadgeAlert size={14} className='text-std-400' />
					<span className='text-xsm text-std-500'>Status</span>
				</div>
				<select
					className='
						flex-1
						px-2 py-1
						rounded
						text-sm
						bg-transparent
						border border-border-light
					'
					value={todo.status}
					onChange={onStatusChange}
				>
					{status_configs.map(config => (
						<option key={config.key} value={config.key}>
							{config.label}
						</option>
					))}
				</select>
			</div>

			<div className='flex items-center gap-3'>
				<div className='flex w-24 items-center gap-2'>
					<Flag size={14} className='text-std-400' />
					<span className='text-xsm text-std-500'>Priority</span>
				</div>
				<select
					className='
						flex-1
						px-2 py-1
						rounded
						text-sm
						bg-transparent
						border border-border-light
					'
					value={todo.priority || 'none'}
					onChange={onPriorityChange}
				>
					<option value='none'>None</option>
					<option value='low'>Low</option>
					<option value='medium'>Medium</option>
					<option value='high'>High</option>
					<option value='urgent'>Urgent</option>
				</select>
			</div>
			<div className='flex items-center gap-3'>
				<div className='flex w-24 items-center gap-2'>
					<Clock size={14} className='text-std-400' />
					<span className='text-xsm text-std-500'>Estimate</span>
				</div>
				<input
					className='
						flex-1
						px-2 py-1
						rounded
						text-sm
						bg-transparent
						border border-border-light
					'
					type='number'
					placeholder='Minutes'
					value={todo.estimate || ''}
					onChange={onEstimateChange}
				/>
			</div>

			<div className='flex items-center gap-3'>
				<div className='flex w-24 items-center gap-2'>
					<Calendar size={14} className='text-std-400' />
					<span className='text-xsm text-std-500'>Due Date</span>
				</div>
				<input
					className='
						flex-1
						px-2 py-1
						rounded
						text-sm
						bg-transparent
						border border-border-light
					'
					type='date'
					value={format_date(todo.due_at)}
					onChange={onDueAtChange}
				/>
			</div>
		</div>
	)
}

export default $app.memo(Index)

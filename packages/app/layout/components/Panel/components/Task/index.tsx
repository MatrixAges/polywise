import { AlertCircle, Clock, Loader } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Button } from 'antd'

import { useGlobal } from '@/context'
import { memo } from '@/utils'

const Index = observer(() => {
	const { memory } = useGlobal()
	const tasks = memory.tasks

	const handleDelete = (task_id: string) => {
		memory.removeTask(task_id)
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'pending':
				return <Clock size={14} className='text-slate-400' />
			case 'processing':
				return <Loader size={14} className='animate-spin text-blue-500' />
			case 'failed':
				return <AlertCircle size={14} className='text-red-500' />
			default:
				return null
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'pending':
				return 'Pending'
			case 'processing':
				return 'Processing'
			case 'failed':
				return 'Failed'
			default:
				return status
		}
	}

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp)
		return date.toLocaleTimeString()
	}

	if (tasks.length === 0) {
		return (
			<div className='flex flex-1 items-center justify-center p-4'>
				<div className='text-center text-slate-500'>
					<Clock size={32} className='mx-auto mb-2 opacity-50' />
					<p className='text-sm'>No tasks</p>
				</div>
			</div>
		)
	}

	return (
		<div className='flex flex-1 flex-col gap-2 overflow-hidden p-4'>
			<div className='flex flex-col gap-2 overflow-auto'>
				{tasks.map(task => (
					<div key={task.id} className='border-std-900/8 flex flex-col gap-1 rounded border p-3'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								{getStatusIcon(task.status)}
								<span className='text-sm font-medium capitalize'>{task.type}</span>
							</div>
							<span className='text-xs text-slate-500'>{formatTime(task.created_at)}</span>
						</div>
						<div className='mt-1 flex items-center justify-between'>
							<span
								className={$cx(
									'text-xs',
									task.status === 'pending' && 'text-slate-400',
									task.status === 'processing' && 'text-blue-500',
									task.status === 'failed' && 'text-red-500'
								)}
							>
								{getStatusText(task.status)}
							</span>

							{(task.status === 'pending' || task.status === 'failed') && (
								<Button
									type='link'
									danger
									size='small'
									onClick={() => handleDelete(task.id)}
								>
									Delete
								</Button>
							)}
						</div>
						{task.error && <div className='mt-2 text-xs text-red-500'>{task.error}</div>}
					</div>
				))}
			</div>
		</div>
	)
})

export default memo(Index)

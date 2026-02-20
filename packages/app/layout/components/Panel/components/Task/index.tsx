import { AlertCircle, Clock, Loader } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Button, Segmented, Pagination, message } from 'antd'
import { useEffect, useState } from 'react'

import { useGlobal } from '@/context'
import { memo, ipc } from '@/utils'
import type { ITask } from '@/models/Memory'

type Tab = 'Processing' | 'Pending' | 'Archive'

const Index = observer(() => {
	const { memory } = useGlobal()
	const [activeTab, setActiveTab] = useState<Tab>('Processing')
	const [archiveTasks, setArchiveTasks] = useState<ITask[]>([])
	const [archiveTotal, setArchiveTotal] = useState(0)
	const [archivePage, setArchivePage] = useState(1)
	const [isLoadingArchive, setIsLoadingArchive] = useState(false)

	const tasks = memory.tasks

	const fetchArchive = async (page: number) => {
		setIsLoadingArchive(true)
		try {
			const res = await ipc.memory.getArchiveTasks.query({ page })
			setArchiveTasks(res.data as any)
			setArchiveTotal(res.total)
			setArchivePage(page)
		} catch (error) {
			message.error('Failed to load archive tasks')
		} finally {
			setIsLoadingArchive(false)
		}
	}

	useEffect(() => {
		if (activeTab === 'Archive') {
			void fetchArchive(1)
		}
	}, [activeTab])

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
			case 'complete':
				return 'Complete'
			default:
				return status
		}
	}

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp)
		return date.toLocaleTimeString()
	}

	const renderTaskList = (list: ITask[]) => {
		if (list.length === 0) {
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
			<div className='flex min-h-0 flex-1 flex-col gap-2 overflow-auto'>
				{list.map(task => (
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
									task.status === 'failed' && 'text-red-500',
									task.status === 'complete' && 'text-green-500'
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
		)
	}

	return (
		<div className='flex h-full flex-1 flex-col gap-4 overflow-hidden p-4'>
			<Segmented
				options={['Processing', 'Pending', 'Archive']}
				value={activeTab}
				onChange={val => setActiveTab(val as Tab)}
				block
			/>

			<div className='flex flex-1 flex-col overflow-hidden'>
				{activeTab === 'Processing' && renderTaskList(tasks.filter(t => t.status === 'processing'))}
				{activeTab === 'Pending' &&
					renderTaskList(tasks.filter(t => t.status === 'pending' || t.status === 'failed'))}
				{activeTab === 'Archive' && (
					<div className='flex h-full flex-1 flex-col overflow-hidden'>
						{isLoadingArchive ? (
							<div className='flex flex-1 items-center justify-center'>
								<Loader size={24} className='animate-spin text-blue-500' />
							</div>
						) : (
							renderTaskList(archiveTasks)
						)}
						<div className='mt-4 flex shrink-0 justify-end'>
							<Pagination
								current={archivePage}
								total={archiveTotal}
								pageSize={100}
								onChange={fetchArchive}
								showSizeChanger={false}
								size='small'
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
})

export default memo(Index)

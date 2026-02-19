import { Button, Empty, Pagination, Spin } from 'antd'

import type { MemoryItem } from './types'

interface MemoryListProps {
	items: Array<MemoryItem>
	loading?: boolean
	onForget?: (memory_id: string) => void
	page?: number
	pageSize?: number
	total?: number
	onPageChange?: (page: number) => void
}

const MemoryList = (props: MemoryListProps) => {
	const { items, loading = false, onForget, page = 1, pageSize = 10, total = 0, onPageChange } = props

	const paginatedData = items.slice((page - 1) * pageSize, page * pageSize)

	return (
		<>
			<div className='flex-1 overflow-auto'>
				<Spin spinning={loading}>
					{paginatedData.length === 0 ? (
						<div className='flex min-h-[180px] items-center justify-center'>
							<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
						</div>
					) : (
						<div className='flex flex-col gap-2'>
							{paginatedData.map(item => (
								<div
									key={item.memory_id}
									className='border-std-900/8 flex items-start justify-between gap-3 rounded border p-3'
								>
									<div className='flex min-w-0 flex-1 flex-col gap-1'>
										<div className='break-words text-slate-900'>
											{item.text}
										</div>
										<div className='flex justify-between text-xs text-slate-500'>
											<span>Score: {item.score.toFixed(4)}</span>
											<span>{item.updated_at}</span>
										</div>
									</div>

									{onForget && (
										<Button
											type='link'
											danger
											onClick={() => onForget(item.memory_id)}
										>
											Forget
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</Spin>
			</div>

			{total > pageSize && (
				<Pagination
					size='small'
					current={page}
					total={total}
					pageSize={pageSize}
					onChange={onPageChange}
					showSizeChanger={false}
					className='mt-auto pt-2'
				/>
			)}
		</>
	)
}

export default MemoryList

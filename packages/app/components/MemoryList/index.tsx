import { Button, List, Pagination } from 'antd'

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
			<List
				className='flex-1 overflow-auto'
				loading={loading}
				dataSource={paginatedData}
				renderItem={(item: MemoryItem) => (
					<List.Item
						actions={
							onForget
								? [
										<Button
											key='delete'
											type='link'
											danger
											onClick={() => onForget(item.memory_id)}
										>
											Forget
										</Button>
									]
								: undefined
						}
					>
						<List.Item.Meta
							description={
								<div className='flex flex-col gap-1'>
									<div className='break-words text-slate-900'>{item.text}</div>
									<div className='flex justify-between text-xs text-slate-500'>
										<span>Score: {item.score.toFixed(4)}</span>
										<span>{item.updated_at}</span>
									</div>
								</div>
							}
						/>
					</List.Item>
				)}
			/>

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

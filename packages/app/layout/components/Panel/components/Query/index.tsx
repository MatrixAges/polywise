import { Button, Input, List, Pagination } from 'antd'
import { useState } from 'react'

import { useGlobal } from '@/context'
import { memo } from '@/utils'

const { TextArea } = Input

const Index = () => {
	const { memory } = useGlobal()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<Array<any>>([])
	const [loading, setLoading] = useState(false)
	const [page, setPage] = useState(1)
	const pageSize = 10

	const handleSearch = async () => {
		if (!query.trim()) return

		setLoading(true)

		try {
			const res = await memory.query({ query })

			setResults(res.memory || [])
			setPage(1)
		} finally {
			setLoading(false)
		}
	}

	const handleForget = async (memory_id: string) => {
		await memory.forget({ memory_id })

		setResults(results.filter(r => r.memory_id !== memory_id))
	}

	const paginatedData = results.slice((page - 1) * pageSize, page * pageSize)

	return (
		<div className='flex flex-1 flex-col gap-4 overflow-hidden p-4'>
			<div className='flex flex-col gap-2'>
				<TextArea
					value={query}
					onChange={e => setQuery(e.target.value)}
					placeholder='Search memory...'
					autoSize={{ minRows: 2, maxRows: 4 }}
				/>
				<Button type='primary' onClick={handleSearch} loading={loading}>
					Search
				</Button>
			</div>

			<List
				className='flex-1 overflow-auto'
				loading={loading}
				dataSource={paginatedData}
				renderItem={(item: any) => (
					<List.Item
						actions={[
							<Button
								key='delete'
								type='link'
								danger
								onClick={() => handleForget(item.memory_id)}
							>
								Forget
							</Button>
						]}
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

			{results.length > pageSize && (
				<Pagination
					size='small'
					current={page}
					total={results.length}
					pageSize={pageSize}
					onChange={setPage}
					showSizeChanger={false}
					className='mt-auto pt-2'
				/>
			)}
		</div>
	)
}

export default memo(Index)

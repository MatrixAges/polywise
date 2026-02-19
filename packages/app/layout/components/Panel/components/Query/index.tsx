import { Button, Input } from 'antd'
import { useState } from 'react'

import { MemoryList } from '@/components'
import { useGlobal } from '@/context'
import { memo } from '@/utils'

import type { MemoryItem } from '@/components/MemoryList/types'

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

			<MemoryList
				items={paginatedData as Array<MemoryItem>}
				loading={loading}
				onForget={handleForget}
				page={page}
				pageSize={pageSize}
				total={results.length}
				onPageChange={setPage}
			/>
		</div>
	)
}

export default memo(Index)

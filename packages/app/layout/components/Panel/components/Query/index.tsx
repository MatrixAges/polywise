import { observer } from 'mobx-react-lite'
import { Button, Input } from 'antd'
import { useCallback, useState } from 'react'

import { MemoryList } from '@/components'
import { useGlobal } from '@/context'
import { memo } from '@/utils'

import type { MemoryItem } from '@/components/MemoryList/types'

const { TextArea } = Input

const Index = observer(() => {
	const { memory } = useGlobal()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<Array<MemoryItem>>([])
	const [loading, setLoading] = useState(false)
	const [page, setPage] = useState(1)

	const page_size = 10

	const handleSearch = useCallback(async () => {
		if (!query.trim()) return

		setLoading(true)

		try {
			const res = (await memory.query({ query })) as Record<string, unknown>

			setResults((res.memory || []) as any)
			setPage(1)
		} finally {
			setLoading(false)
		}
	}, [memory, query])

	const handleForget = useCallback(
		async (memory_id: string) => {
			await memory.forget({ memory_id })

			setResults(results.filter(r => r.memory_id !== memory_id))
		},
		[memory, results]
	)

	return (
		<div className='flex flex-1 flex-col gap-4 p-4'>
			<div className='flex flex-col gap-2'>
				<TextArea
					value={query}
					onChange={e => setQuery(e.target.value)}
					placeholder='Search memory...'
					autoSize={{ minRows: 2, maxRows: 4 }}
					onPressEnter={e => {
						if (!e.shiftKey) {
							e.preventDefault()
							handleSearch()
						}
					}}
				/>
				<Button type='primary' onClick={handleSearch} loading={loading} block>
					Search
				</Button>
			</div>

			<div className='flex flex-1 overflow-hidden'>
				<MemoryList
					items={results}
					loading={loading}
					onForget={handleForget}
					page={page}
					pageSize={page_size}
					total={results.length}
					onPageChange={setPage}
				/>
			</div>
		</div>
	)
})

export default memo(Index)

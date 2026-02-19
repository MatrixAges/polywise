import { useCallback, useState, useMemo } from 'react'
import { Button, Input, Segmented } from 'antd'
import { useShallow } from 'mobx-react-lite'

import { MemoryList } from '@/components'
import { useGlobal } from '@/context'
import { memo } from '@/utils'

import MemoryGraph from './components/MemoryGraph'

import type { MemoryItem } from '@/components/MemoryList/types'

const { TextArea } = Input

const Index = () => {
	const { memory, settings } = useGlobal()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<Array<any>>([])
	const [loading, setLoading] = useState(false)
	const [page, setPage] = useState(1)
	const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
	const pageSize = 10

	const handleSearch = useCallback(async () => {
		if (!query.trim()) return

		setLoading(true)

		try {
			const res = await memory.query({ query })

			setResults(res.memory || [])
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

	const graphData = useMemo(() => {
		if (results.length === 0) return { nodes: [], edges: [] }

		const nodes = results.map((item, index) => ({
			id: item.memory_id,
			data: { label: item.text.slice(0, 30) + (item.text.length > 30 ? '...' : '') },
			position: {
				x: (index % 3) * 200 + Math.random() * 50,
				y: Math.floor(index / 3) * 150 + Math.random() * 50
			}
		}))

		const edges: Array<any> = []
		for (let i = 0; i < results.length - 1; i++) {
			if (results[i + 1]) {
				edges.push({
					id: `e${i}-${i + 1}`,
					source: results[i].memory_id,
					target: results[i + 1].memory_id,
					type: 'smoothstep',
					animated: true
				})
			}
		}

		return { nodes, edges }
	}, [results])

	return (
		<div className='flex h-full w-full flex-col gap-4 p-4'>
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
				<div className='flex items-center justify-between'>
					<Button type='primary' onClick={handleSearch} loading={loading}>
						Search
					</Button>
					{results.length > 0 && (
						<Segmented
							options={[
								{ label: 'List', value: 'list' },
								{ label: 'Graph', value: 'graph' }
							]}
							value={viewMode}
							onChange={value => setViewMode(value as 'list' | 'graph')}
						/>
					)}
				</div>
			</div>

			<div className='flex flex-1 overflow-hidden'>
				{viewMode === 'list' ? (
					<MemoryList
						items={results as Array<MemoryItem>}
						loading={loading}
						onForget={handleForget}
						page={page}
						pageSize={pageSize}
						total={results.length}
						onPageChange={setPage}
					/>
				) : (
					<MemoryGraph data={graphData} />
				)}
			</div>
		</div>
	)
}

export default memo(Index)

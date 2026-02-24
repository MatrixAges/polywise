import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Segmented } from 'antd'

import { MemoryList } from '@/components'
import { useGlobal } from '@/context'
import { memo } from '@/utils'

import MemoryGraph from './components/MemoryGraph'

import type { MemoryItem } from '@/components/MemoryList/types'

const { TextArea } = Input

interface BrainNode {
	id: string
	label: string
	x: number
	y: number
	activation: number
	potential: number
	idol_id?: string | null
	root_ids?: Array<string> | null
	metrics_ids?: Array<string> | null
	created_at: string
	updated_at: string
}

interface BrainEdge {
	source_id: string
	target_id: string
	weight: number
	distance: number
	type?: string | null
	idol_id?: string | null
	root_ids?: Array<string> | null
	metrics_ids?: Array<string> | null
	created_at: string
	updated_at: string
}

interface SnapshotResult {
	nodes?: Array<BrainNode>
	edges?: Array<BrainEdge>
}

const Index = () => {
	const { memory } = useGlobal()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<Array<MemoryItem>>([])
	const [loading, setLoading] = useState(false)
	const [page, setPage] = useState(1)
	const [view_mode, set_view_mode] = useState<'list' | 'graph'>('list')
	const [graph_loading, set_graph_loading] = useState(false)
	const [graph_nodes, set_graph_nodes] = useState<Array<BrainNode>>([])
	const [graph_edges, set_graph_edges] = useState<Array<BrainEdge>>([])
	const [graph_loaded, set_graph_loaded] = useState(false)

	const page_size = 10

	const loadGraph = useCallback(async () => {
		set_graph_loading(true)

		try {
			let result: SnapshotResult

			if (query.trim()) {
				result = (await memory.recall({
					query,
					max_depth: 3,
					limit: 30
				})) as unknown as SnapshotResult
			} else {
				result = (await memory.snapshot({ weight_threshold: 0.2, limit: 60 })) as SnapshotResult
			}

			set_graph_nodes(result.nodes || [])
			set_graph_edges(result.edges || [])
			set_graph_loaded(true)
		} finally {
			set_graph_loading(false)
		}
	}, [memory, query])

	const handleSearch = useCallback(async () => {
		if (!query.trim()) return

		setLoading(true)

		try {
			const res = (await memory.query({ query })) as Record<string, unknown>

			setResults((res.memory || []) as any)
			setPage(1)

			if (view_mode === 'graph') {
				await loadGraph()
			}
		} finally {
			setLoading(false)
		}
	}, [loadGraph, memory, query, view_mode])

	const handleForget = useCallback(
		async (memory_id: string) => {
			await memory.forget({ memory_id })

			setResults(results.filter(r => r.memory_id !== memory_id))
		},
		[memory, results]
	)

	const handleNodeClick = useCallback(
		async (node_id: string) => {
			set_graph_loading(true)

			try {
				const result = await memory.expand({ node_id, limit: 20 })
				const new_nodes = result.nodes || []
				const new_edges = result.edges || []

				set_graph_nodes((prev: Array<BrainNode>) => {
					const existing_ids = new Set(prev.map(n => n.id))
					const filtered_new = (new_nodes as Array<BrainNode>).filter(n => !existing_ids.has(n.id))
					return [...prev, ...filtered_new]
				})

				set_graph_edges((prev: Array<BrainEdge>) => {
					const existing_keys = new Set(prev.map(e => `${e.source_id}_${e.target_id}`))
					const filtered_new = (new_edges as Array<BrainEdge>).filter(
						e => !existing_keys.has(`${e.source_id}_${e.target_id}`)
					)
					return [...prev, ...filtered_new]
				})
			} finally {
				set_graph_loading(false)
			}
		},
		[memory]
	)

	useEffect(() => {
		if (view_mode !== 'graph' || graph_loaded) return

		void loadGraph()
	}, [graph_loaded, loadGraph, view_mode])

	// Automatically reload graph data when query changes
	useEffect(() => {
		if (view_mode === 'graph') {
			set_graph_loaded(false)
		}
	}, [query, view_mode])

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
					<div className='flex items-center gap-2'>
						{view_mode === 'graph' && (
							<Button onClick={() => void loadGraph()} loading={graph_loading}>
								Refresh Graph
							</Button>
						)}

						<Segmented
							options={[
								{ label: 'List', value: 'list' },
								{ label: 'Graph', value: 'graph' }
							]}
							value={view_mode}
							onChange={value => set_view_mode(value as 'list' | 'graph')}
						/>
					</div>
				</div>
			</div>

			<div className='flex flex-1 overflow-hidden'>
				{view_mode === 'list' ? (
					<MemoryList
						items={results}
						loading={loading}
						onForget={handleForget}
						page={page}
						pageSize={page_size}
						total={results.length}
						onPageChange={setPage}
					/>
				) : (
					<MemoryGraph
						nodes={graph_nodes}
						edges={graph_edges}
						loading={graph_loading}
						onNodeClick={handleNodeClick}
					/>
				)}
			</div>
		</div>
	)
}

export default memo(Index)

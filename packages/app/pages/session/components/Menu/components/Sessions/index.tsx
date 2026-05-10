import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { useModel } from '@/pages/session/context'

import Item from './Item'
import PinItem from './PinItem'

import type { DragEndEvent } from '@dnd-kit/core'
import type { IPropsSessions } from '../../../../types'

const Index = (props: IPropsSessions) => {
	const {
		pins,
		sessions,
		selectedSessionId,
		renamePin,
		renameSessionIndex,
		renameValue,
		hasMore,
		loading,
		loadingMore
	} = props
	const { onScroll, loadMore, sortPin } = useModel()
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const onDragEnd = (args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = pins.findIndex(item => item.id === active.id)
		const to = pins.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		sortPin(from, to)
	}

	return (
		<div
			className='
				overflow-y-auto
				w-full h-full
				px-1.5 pt-1.5
			'
			onScroll={onScroll}
		>
			<div
				className='
					flex flex-col
					gap-1
					pb-3
				'
			>
				{pins.length > 0 && (
					<>
						<div
							className='
								px-2.5 pt-1
								text-[11px] text-std-400 font-medium tracking-wide
								uppercase
							'
						>
							Pinned
						</div>
						<DndContext sensors={sensors} onDragEnd={onDragEnd}>
							<SortableContext
								items={pins.map(item => item.id)}
								strategy={verticalListSortingStrategy}
							>
								{pins.map((item, session_index) => {
									const selected = selectedSessionId === item.id
									const renaming = renamePin && renameSessionIndex === session_index

									return (
										<PinItem
											item={item}
											pin={true}
											sessionIndex={session_index}
											selected={selected}
											renaming={renaming}
											renameValue={renaming ? renameValue : ''}
											key={item.id}
										></PinItem>
									)
								})}
							</SortableContext>
						</DndContext>
						<div className='border-border-light my-1 border-b'></div>
					</>
				)}
				{sessions.map((item, session_index) => {
					const selected = selectedSessionId === item.id
					const renaming = !renamePin && renameSessionIndex === session_index

					return (
						<Item
							item={item}
							pin={false}
							sessionIndex={session_index}
							selected={selected}
							renaming={renaming}
							renameValue={renaming ? renameValue : ''}
							key={item.id}
						></Item>
					)
				})}
				{hasMore && (
					<button
						type='button'
						className='
							px-2.5 py-1
							text-xsm text-std-400
							text-left
							disabled:cursor-not-allowed disabled:opacity-50
							hover:text-std-800
							clickit
						'
						onClick={() => loadMore()}
						disabled={loading || loadingMore}
					>
						{loading || loadingMore ? 'Loading...' : 'Show more'}
					</button>
				)}
			</div>
		</div>
	)
}

export default $app.memo(Index)

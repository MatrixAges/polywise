import { useModel } from '@/pages/session/context'

import Item from './Item'

import type { IPropsSessions } from '../../../../types'

const Index = (props: IPropsSessions) => {
	const {
		sessions,
		pinMap,
		selectedSessionId,
		renameGroupIndex,
		renameSessionIndex,
		renameValue,
		hasMore,
		loading,
		loadingMore
	} = props
	const { onScroll, loadMore } = useModel()

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
				{sessions.map((item, session_index) => {
					const selected = selectedSessionId === item.id
					const renaming = renameGroupIndex === undefined && renameSessionIndex === session_index

					return (
						<Item
							item={item}
							pin={item.id in pinMap}
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

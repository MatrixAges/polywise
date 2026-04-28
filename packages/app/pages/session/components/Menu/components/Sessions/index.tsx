import { useModel } from '@/pages/session/context'

import Item from './Item'

import type { IPropsSessions } from '../../../../types'

const Index = (props: IPropsSessions) => {
	const {
		sessions,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_index,
		rename_value,
		has_more,
		loading,
		loading_more
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
					const selected = selected_session_id === item.id
					const renaming =
						rename_group_index === undefined && rename_session_index === session_index

					return (
						<Item
							item={item}
							pin={item.id in pin_map}
							session_index={session_index}
							selected={selected}
							renaming={renaming}
							rename_value={renaming ? rename_value : ''}
							key={item.id}
						></Item>
					)
				})}
				{has_more && (
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
						disabled={loading || loading_more}
					>
						{loading || loading_more ? 'Loading...' : 'Show more'}
					</button>
				)}
			</div>
		</div>
	)
}

export default $app.memo(Index)

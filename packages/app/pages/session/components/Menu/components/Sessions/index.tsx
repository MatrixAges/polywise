import { useMenuContext } from '@/pages/session/context'

import Item from './Item'

import type { IPropsSessions } from '../../../../types'

const Index = (props: IPropsSessions) => {
	const { groups, sessions, pin_map, selected_session_id, rename_group_index, rename_session_index, rename_value } =
		props
	const { onScroll } = useMenuContext()

	return (
		<div
			className='
				overflow-y-auto
				flex-1
				px-1.5
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
							groups={groups}
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
			</div>
		</div>
	)
}

export default $app.memo(Index)

import { useMenuContext } from '@/pages/session/context'

import Item from './Item'

import type { IPropsSessions } from '../../../../types'
import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessions) => {
	const { groups, sessions, pin_map, selected_session_id, rename_session_id, rename_value } = props
	const actions = useMenuContext()

	const props_item: Omit<IPropsSessionItem, 'item' | 'selected' | 'renaming' | 'rename_value'> = {
		groups,
		pin_map
	}

	return (
		<div className='flex-1 overflow-y-auto px-1.5 py-3' onScroll={actions.onScroll}>
			<div className='flex flex-col gap-1'>
				{sessions.map(item => {
					const selected = selected_session_id === item.id
					const renaming = rename_session_id === item.id

					return (
						<Item
							item={item}
							selected={selected}
							renaming={renaming}
							rename_value={renaming ? rename_value : ''}
							{...props_item}
							key={item.id}
						></Item>
					)
				})}
			</div>
		</div>
	)
}

export default $app.memo(Index)

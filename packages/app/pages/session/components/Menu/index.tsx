import { useMemo } from 'react'

import { Groups, Sessions } from './components'

import type { IPropsGroups, IPropsMenu, IPropsSessions } from '../../types'

const Index = (props: IPropsMenu) => {
	const { groups, sessions, pin_map, selected_session_id, rename_group_index, rename_session_id, rename_value } =
		props

	const props_groups: IPropsGroups = useMemo(
		() => ({
			groups: $copy(groups),
			pin_map: $copy(pin_map),
			selected_session_id,
			rename_group_index,
			rename_session_id,
			rename_value
		}),
		[groups, pin_map, selected_session_id, rename_group_index, rename_session_id, rename_value]
	)

	const props_sessions: IPropsSessions = useMemo(
		() => ({
			groups: $copy(groups),
			sessions: $copy(sessions),
			pin_map: $copy(pin_map),
			selected_session_id,
			rename_session_id,
			rename_value
		}),
		[groups, sessions, pin_map, selected_session_id, rename_session_id, rename_value]
	)

	return (
		<div
			className='
				overflow-hidden
				flex flex-none flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<Groups {...props_groups}></Groups>
			<Sessions {...props_sessions}></Sessions>
		</div>
	)
}

export default $app.memo(Index)

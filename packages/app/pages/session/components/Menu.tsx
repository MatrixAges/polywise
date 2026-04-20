import { useMemo } from 'react'

import { GroupList, SessionList } from '.'

import type { IPropsMenu } from '../types'

const Index = (props: IPropsMenu) => {
	const { groups, sessions, selected_session_id, setSelectedSession, loadMore } = props
	const props_group_list = useMemo(
		() => ({
			groups: $copy(groups),
			selected_session_id,
			setSelectedSession
		}),
		[groups, selected_session_id, setSelectedSession]
	)
	const props_session_list = useMemo(
		() => ({
			sessions: $copy(sessions),
			selected_session_id,
			setSelectedSession,
			loadMore
		}),
		[sessions, selected_session_id, setSelectedSession, loadMore]
	)

	return (
		<div>
			<GroupList {...props_group_list}></GroupList>
			<SessionList {...props_session_list}></SessionList>
		</div>
	)
}

export default $app.memo(Index)

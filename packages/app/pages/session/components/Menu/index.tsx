import { useMemo } from 'react'
import { useMemoizedFn } from 'ahooks'

import { Groups, Sessions } from './components'

import type { IPropsGroups, IPropsMenu, IPropsSessions } from '../../types'

const Index = (props: IPropsMenu) => {
	const {
		groups,
		sessions,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_id,
		rename_value,
		setSelectedSession,
		startRenameGroup,
		startRenameSession,
		setRenameValue,
		submitRename,
		cancelRename,
		createSession,
		createGroup,
		removeSession,
		removeGroup,
		togglePinSession,
		sortGroup,
		sortGroupSession,
		moveSessionToGroup,
		moveSessionOutGroup,
		onScroll
	} = props

	const handleSelectSession = useMemoizedFn((id: string) => setSelectedSession(id))

	const props_groups: IPropsGroups = useMemo(
		() => ({
			groups: $copy(groups),
			pin_map: $copy(pin_map),
			selected_session_id,
			rename_group_index,
			rename_session_id,
			rename_value,
			setSelectedSession: handleSelectSession,
			startRenameGroup,
			startRenameSession,
			setRenameValue,
			submitRename,
			cancelRename,
			createSession,
			createGroup,
			removeSession,
			removeGroup,
			togglePinSession,
			sortGroup,
			sortGroupSession,
			moveSessionToGroup,
			moveSessionOutGroup
		}),
		[
			groups,
			pin_map,
			selected_session_id,
			rename_group_index,
			rename_session_id,
			rename_value,
			handleSelectSession,
			startRenameGroup,
			startRenameSession,
			setRenameValue,
			submitRename,
			cancelRename,
			createSession,
			createGroup,
			removeSession,
			removeGroup,
			togglePinSession,
			sortGroup,
			sortGroupSession,
			moveSessionToGroup,
			moveSessionOutGroup
		]
	)

	const props_sessions: IPropsSessions = useMemo(
		() => ({
			groups: $copy(groups),
			sessions: $copy(sessions),
			pin_map: $copy(pin_map),
			selected_session_id,
			rename_session_id,
			rename_value,
			setSelectedSession: handleSelectSession,
			startRenameSession,
			setRenameValue,
			submitRename,
			cancelRename,
			createSession,
			createGroup,
			removeSession,
			togglePinSession,
			moveSessionToGroup,
			onScroll
		}),
		[
			groups,
			sessions,
			pin_map,
			selected_session_id,
			rename_session_id,
			rename_value,
			handleSelectSession,
			startRenameSession,
			setRenameValue,
			submitRename,
			cancelRename,
			createSession,
			createGroup,
			removeSession,
			togglePinSession,
			moveSessionToGroup,
			onScroll
		]
	)

	return (
		<div
			className='
				overflow-hidden
				flex flex-none flex-col
				w-80 h-full
				border-r
			'
		>
			<Groups {...props_groups}></Groups>
			<Sessions {...props_sessions}></Sessions>
		</div>
	)
}

export default $app.memo(Index)

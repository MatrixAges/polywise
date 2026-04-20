import { useMemo } from 'react'
import { useMemoizedFn } from 'ahooks'

import { Groups, Sessions } from './components'

import type { IPropsGroups, IPropsMenu, IPropsSessions } from '../../types'

const Index = (props: IPropsMenu) => {
	const { groups, sessions, selected_session_id, setSelectedSession, onScroll } = props
	const handleSelectSession = useMemoizedFn((id: string) => setSelectedSession(id))
	const props_groups: IPropsGroups = useMemo(
		() => ({
			groups: $copy(groups),
			selected_session_id,
			setSelectedSession: handleSelectSession
		}),
		[groups, selected_session_id, handleSelectSession]
	)
	const props_sessions: IPropsSessions = useMemo(
		() => ({
			sessions: $copy(sessions),
			selected_session_id,
			setSelectedSession: handleSelectSession,
			onScroll
		}),
		[sessions, selected_session_id, handleSelectSession, onScroll]
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

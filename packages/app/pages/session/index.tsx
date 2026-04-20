import { useLayoutEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Session } from '@/components'

import { Menu } from './components'
import Model from './model'

import type { IPropsMenu } from './types'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const props_menu: IPropsMenu = useMemo(
		() => ({
			groups: $copy(x.groups),
			sessions: $copy(x.sessions),
			pin_map: $copy(x.pin_map),
			selected_session_id: x.selected_session_id,
			rename_group_index: x.rename_group_index,
			rename_session_id: x.rename_session_id,
			rename_value: x.rename_value,
			setSelectedSession: x.setSelectedSession,
			startRenameGroup: x.startRenameGroup,
			startRenameSession: x.startRenameSession,
			setRenameValue: x.setRenameValue,
			submitRename: x.submitRename,
			cancelRename: x.cancelRename,
			createSession: x.createSession,
			createGroup: x.createGroup,
			removeSession: x.removeSession,
			removeGroup: x.removeGroup,
			togglePinSession: x.togglePinSession,
			sortGroup: x.sortGroup,
			sortGroupSession: x.sortGroupSession,
			moveSessionToGroup: x.moveSessionToGroup,
			moveSessionOutGroup: x.moveSessionOutGroup,
			onScroll: x.onScroll
		}),
		[
			x.groups,
			x.sessions,
			x.pin_map,
			x.selected_session_id,
			x.rename_group_index,
			x.rename_session_id,
			x.rename_value,
			x.setSelectedSession,
			x.startRenameGroup,
			x.startRenameSession,
			x.setRenameValue,
			x.submitRename,
			x.cancelRename,
			x.createSession,
			x.createGroup,
			x.removeSession,
			x.removeGroup,
			x.togglePinSession,
			x.sortGroup,
			x.sortGroupSession,
			x.moveSessionToGroup,
			x.moveSessionOutGroup,
			x.onScroll
		]
	)

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<div className='flex h-full overflow-hidden'>
			<Menu {...props_menu}></Menu>
			<div className='flex h-full min-w-0 flex-1'>
				{x.selected_session_id ? (
					<Session id={x.selected_session_id}></Session>
				) : (
					<div className='h-full w-full'></div>
				)}
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

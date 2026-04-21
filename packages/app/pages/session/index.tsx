import { useLayoutEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Session } from '@/components'

import { Menu } from './components'
import Model from './model'

import type { IPropsMenu } from './types'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	const props_menu: IPropsMenu = {
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
	}

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<div className='flex h-full overflow-hidden'>
			<Menu {...props_menu}></Menu>
			<div
				className='
					flex
					w-[calc(100%-240px)] h-full
					py-0
					page_wrap
				'
			>
				<div className='h-full w-full'>
					<Session
						id={x.selected_session_id}
						input={x.temp_input}
						create={x.createSession}
					></Session>
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

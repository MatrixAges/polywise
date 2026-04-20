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
			selected_session_id: x.selected_session_id,
			setSelectedSession: x.setSelectedSession,
			onScroll: x.onScroll
		}),
		[x.groups, x.sessions, x.selected_session_id, x.setSelectedSession, x.onScroll]
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

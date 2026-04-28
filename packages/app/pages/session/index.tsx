import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useLocation, useNavigate } from 'react-router'
import { container } from 'tsyringe'

import { Session } from '@/components'
import { useGlobal } from '@/context'

import { Menu } from './components'
import { Context } from './context'
import Model from './model'

import type { IPropsMenu } from './types'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()
	const { state, pathname } = useLocation()
	const navigate = useNavigate()

	useLayoutEffect(() => {
		if (state?.create) {
			x.createSession()

			navigate(pathname, { replace: true, state: null })
		}

		x.init()

		return () => x.deinit()
	}, [])

	const props_menu: IPropsMenu = {
		current_tab: x.current_tab,
		groups: $copy(x.groups),
		sessions: $copy(x.sessions),
		pin_map: $copy(x.pin_map),
		selected_session_id: x.selected_session_id,
		rename_group_index: x.rename_group_index,
		rename_session_index: x.rename_session_index,
		rename_value: x.rename_value,
		has_more: x.has_more,
		loading: x.loading,
		loading_more: x.loading_more
	}

	return (
		<div className='flex h-full overflow-hidden'>
			{!global.setting.sidebar_collapsed && (
				<Context value={x}>
					<Menu {...props_menu}></Menu>
				</Context>
			)}
			<div className='h-full w-[calc(100%-210px)] flex-1'>
				<Session
					type='page'
					id={x.selected_session_id}
					input={x.temp_input}
					create={!x.selected_session_id ? x.createSession : undefined}
				></Session>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

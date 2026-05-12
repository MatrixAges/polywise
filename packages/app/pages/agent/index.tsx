import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { AvatarDialog, Detail, GroupPanel, Menu, SessionsPanel } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				<Menu></Menu>
				{x.menu_scope === 'group' ? (
					<GroupPanel></GroupPanel>
				) : x.page_mode === 'sessions' ? (
					<SessionsPanel></SessionsPanel>
				) : (
					<Detail></Detail>
				)}
			</div>
			<AvatarDialog></AvatarDialog>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

import { useLayoutEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'

import { AvatarDialog, Detail, GroupPanel, Menu, SessionsPanel } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const x = useMemo(() => container.resolve(Model), [])
	const global = useGlobal()

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				{!global.setting.sidebar_collapsed && <Menu></Menu>}
				<div className='flex min-w-0 flex-1'>
					{x.menu_scope === 'group' ? (
						<GroupPanel></GroupPanel>
					) : x.page_mode === 'sessions' ? (
						<SessionsPanel></SessionsPanel>
					) : (
						<Detail></Detail>
					)}
				</div>
			</div>
			<AvatarDialog></AvatarDialog>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'

import {
	AddDialog,
	AgentDialog,
	BatchSessionDialog,
	BatchStartDialog,
	BookmarkSnifferDialog,
	Content,
	ControlCenter,
	Menu
} from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()

	useLayoutEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [])

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				{!global.setting.sidebar_collapsed && <Menu></Menu>}
				<div className='relative flex min-w-0 flex-1'>
					<Content></Content>
					<ControlCenter></ControlCenter>
				</div>
			</div>
			<AddDialog></AddDialog>
			<AgentDialog></AgentDialog>
			<BatchSessionDialog></BatchSessionDialog>
			<BatchStartDialog></BatchStartDialog>
			<BookmarkSnifferDialog></BookmarkSnifferDialog>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

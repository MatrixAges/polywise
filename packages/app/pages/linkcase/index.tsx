import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { BatchSessionDialog, BatchStartDialog, BookmarkSnifferDialog, Content, Menu } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [])

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				<Menu></Menu>
				<Content></Content>
			</div>
			<BatchSessionDialog></BatchSessionDialog>
			<BatchStartDialog></BatchStartDialog>
			<BookmarkSnifferDialog></BookmarkSnifferDialog>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

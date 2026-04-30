import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Menu, TodoDetail, TodoList } from './components'
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
			<div className='bg-background flex h-full overflow-hidden'>
				<Menu></Menu>
				<TodoList></TodoList>
				{x.detail_panel_open && <TodoDetail></TodoDetail>}
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

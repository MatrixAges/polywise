import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Archives, Kanban, Menu, TodoDetail } from './components'
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
				<Kanban></Kanban>
				{x.detail_todo && <TodoDetail></TodoDetail>}
				{x.archive_open && <Archives></Archives>}
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

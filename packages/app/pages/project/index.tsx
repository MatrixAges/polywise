import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { AddModal, Menu } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				<Menu></Menu>
			</div>
			<AddModal></AddModal>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

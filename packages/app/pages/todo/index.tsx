import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import Model from './_model'
// import { Menu } from './components'
import { Context } from './context'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<Context value={x}>
			<div className='bg-background flex h-full overflow-hidden'></div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

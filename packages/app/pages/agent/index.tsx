import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.init()

		return () => x.off()
	}, [])

	return <div className='flex'>agent</div>
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

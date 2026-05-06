import { Fragment, useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import Dialog from './Dialog'
import Model from './model'
import Status from './Status'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [x])

	return (
		<Fragment>
			<Status x={x}></Status>
			<Dialog x={x}></Dialog>
		</Fragment>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import '@/styles/index.css'

import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { GlobalProvider } from '@/context'
import GlobalModel from '@/models/global'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))

	useLayoutEffect(() => {
		global.init()

		return () => global.off()
	}, [])

	return (
		<GlobalProvider value={global}>
			<div></div>
		</GlobalProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

import { useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import View from './components/View'
import { Context } from './context'
import Model from './model'

import type { IPropsInput } from '../../types'

const Index = (props: IPropsInput) => {
	const global = useGlobal()
	const [x] = useState(() => new Model(props, global.setting))

	x.sync(props, global.setting)

	return (
		<Context value={x}>
			<View />
		</Context>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Content } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const ref_model = useRef<Model | null>(null)

	if (!ref_model.current) {
		ref_model.current = container.resolve(Model)
	}

	const x = ref_model.current

	useEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	return (
		<Context value={x}>
			<Content></Content>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

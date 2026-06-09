import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { ProviderSection } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		void x.init()
	}, [x])

	return (
		<Context value={x}>
			<div
				className='
					overflow-y-scroll
					flex flex-col
					w-full h-full
					gap-5
					page_wrap
				'
			>
				<ProviderSection></ProviderSection>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

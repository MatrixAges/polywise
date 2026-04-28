import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Menu } from './components'
import { Context } from './context'
import Model from './model'

import type { IPropsMenu } from './types'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const props_menu: IPropsMenu = {
		projects: $copy(x.projects)
	}

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				<Menu {...props_menu}></Menu>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

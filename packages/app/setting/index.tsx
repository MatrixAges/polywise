import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'

import { Sidebar } from './components'
import Model from './model'

import type { IPropsSidebar } from './types'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()

	const s = global.settings

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const props_sidebar: IPropsSidebar = {
		sidebar_collapsed: s.sidebar_collapsed
	}

	return (
		<div className='flex'>
			<Sidebar {...props_sidebar}></Sidebar>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

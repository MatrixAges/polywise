import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { FileTree, Session } from '@/components'
import { useModelContext } from '@/hooks'

import { Menu } from './components'
import { PageContext } from './context'
import Model from './model'

import type { IPageContext } from './context'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	// const project_context = useModelContext<Model, IPageContext>(x, {})

	return (
		<div className='flex h-full overflow-hidden'>
			<Menu></Menu>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

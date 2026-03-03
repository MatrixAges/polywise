import { useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Lazy } from '@/components'
import { useGlobal } from '@/context'

import Model from './model'
import Sidebar from './Sidebar'

import type { IPropsSidebar } from './types'

const Index = () => {
	const global = useGlobal()
	const [x] = useState(() => container.resolve(Model))

	const s = global.settings

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const props_sidebar: IPropsSidebar = {
		sidebar_collapsed: s.sidebar_collapsed,
		active: x.active,
		toggleActive: useMemoizedFn((v: string) => (x.active = v))
	}

	return (
		<div className='flex h-full w-full'>
			<Sidebar {...props_sidebar}></Sidebar>
			<div
				className='
					flex flex-1
					h-full
					p-2 pt-0
				'
			>
				<div
					className='
						overflow-y-scroll
						w-full h-full
						p-6
						rounded-2xl
						bg-std-50
					'
				>
					<div className='w-full'>
						<Lazy type='setting' path={x.active}></Lazy>
					</div>
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

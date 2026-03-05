import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Outlet, useNavigate } from 'react-router'
import { container } from 'tsyringe'

import { setting_items } from '@/appdata'
import { Container, Lazy, Sidebar } from '@/components'
import { useGlobal } from '@/context'

import Model from './model'

const Index = () => {
	const global = useGlobal()
	const [x] = useState(() => container.resolve(Model))
	const navgate = useNavigate()

	const s = global.setting

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<div className='flex h-full w-full'>
			{s.sidebar_collapsed && (
				<Sidebar
					groups={[{ label: 'Settings', items: setting_items }]}
					current={x.current}
					width={180}
					setCurrent={v => navgate('/setting/' + v)}
				></Sidebar>
			)}
			<Container>
				<Outlet></Outlet>
			</Container>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

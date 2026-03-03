import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { setting_items } from '@/appdata'
import { Lazy, Sidebar } from '@/components'
import { useGlobal } from '@/context'

import Model from './model'

const Index = () => {
	const global = useGlobal()
	const [x] = useState(() => container.resolve(Model))

	const s = global.settings

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<div className='flex h-full w-full'>
			<Sidebar
				groups={[{ label: 'Settings', items: setting_items }]}
				current={x.current}
				setCurrent={x.setCurrent}
			></Sidebar>
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
						rounded-2xl
						bg-dev/50
					'
				>
					<div className='w-full'>
						<Lazy type='setting' path={x.current}></Lazy>
					</div>
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

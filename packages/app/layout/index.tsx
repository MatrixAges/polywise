import '@/styles/index.css'

import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { GlobalProvider } from '@/context'
import GlobalModel from '@/models/global'

import { Chat, Content, Sidebar } from './components'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))

	useLayoutEffect(() => {
		global.init()

		return () => global.off()
	}, [])

	return (
		<GlobalProvider value={global}>
			<div className='text-std-300 flex'>
				<Sidebar></Sidebar>
				<div
					className='
						flex flex-1
						gap-3
						p-3.5
						pl-0
					'
				>
					<Content></Content>
					<Chat></Chat>
				</div>
			</div>
		</GlobalProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

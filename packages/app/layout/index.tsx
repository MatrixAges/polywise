import '@/styles/index.css'

import { useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { ConfigProvider } from 'antd'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { GlobalProvider } from '@/context'
import GlobalModel from '@/models/Global'
import Settings from '@/settings'

import { Chat, Content, Sidebar } from './components'

import type { ConfigProviderProps } from 'antd'
import type { IPropsSidebar } from './types'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))

	useLayoutEffect(() => {
		global.init()

		return () => global.off()
	}, [])

	const props_config_provider: ConfigProviderProps = {
		prefixCls: 'pw',
		theme: {
			hashed: false,
			cssVar: { prefix: 'pw' },
			components: {
				Form: { itemMarginBottom: 12 }
			}
		}
	}

	const props_sidebar: IPropsSidebar = {
		openSettings: useMemoizedFn(() => (global.settings.open = true))
	}

	return (
		<ConfigProvider {...props_config_provider}>
			<GlobalProvider value={global}>
				<div className='text-std-300 flex'>
					<Sidebar {...props_sidebar}></Sidebar>
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
				<Settings></Settings>
			</GlobalProvider>
		</ConfigProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

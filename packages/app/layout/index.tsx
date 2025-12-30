import '@/styles/index.css'

import { useLayoutEffect, useMemo, useState } from 'react'
import { ConfigProvider } from 'antd'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { GlobalProvider } from '@/context'
import GlobalModel from '@/models/Global'
import Settings from '@/settings'
import { getAntdTheme } from '@/theme'

import { Chat, Content, Sidebar } from './components'

import type { ConfigProviderProps } from 'antd'
import type { IPropsChat, IPropsContent, IPropsSidebar } from './types'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))
	const settings = global.settings

	useLayoutEffect(() => {
		global.init()

		return () => global.off()
	}, [])

	const props_config_provider: ConfigProviderProps = useMemo(
		() => ({
			prefixCls: 'pw',
			variant: 'filled',
			theme: getAntdTheme(settings.theme_value)
		}),
		[settings.theme_value]
	)

	const props_sidebar: IPropsSidebar = {
		toggleSettings: settings.toggleSettings
	}

	const props_content: IPropsContent = {
		glass: settings.glass
	}

	const props_chat: IPropsChat = {
		glass: settings.glass
	}

	return (
		<ConfigProvider {...props_config_provider}>
			<GlobalProvider value={global}>
				<div className={$cx(`flex`, global.settings.glass ? 'bg-std-100/30' : 'bg-std-100')}>
					<Sidebar {...props_sidebar}></Sidebar>
					<div
						className='
							flex flex-1
							gap-2
							p-2
							pl-0
						'
					>
						<Content {...props_content}></Content>
						<Chat {...props_chat}></Chat>
					</div>
				</div>
				<Settings></Settings>
			</GlobalProvider>
		</ConfigProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

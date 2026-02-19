import '@/styles/index.css'

import { useLayoutEffect, useMemo, useState } from 'react'
import { ConfigProvider } from 'antd'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { GlobalProvider } from '@/context'
import GlobalModel from '@/models/Global'
import Settings from '@/settings'
import { getAntdTheme } from '@/theme'

import { Page, Panel, Tab } from './components'

import type { ConfigProviderProps } from 'antd'
import type { IPropsPage, IPropsPanel, IPropsTab } from './types'

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
			wave: { disabled: true },
			theme: getAntdTheme(settings.theme_value)
		}),
		[settings.theme_value]
	)

	const props_tab: IPropsTab = {}

	const props_page: IPropsPage = {}

	const props_right_panel: IPropsPanel = {}

	return (
		<ConfigProvider {...props_config_provider}>
			<GlobalProvider value={global}>
				<div className='flex h-screen'>
					<div className='flex h-full flex-1 flex-col'>
						<Tab {...props_tab}></Tab>
						<Page {...props_page}></Page>
					</div>
					<Panel {...props_right_panel}></Panel>
				</div>
				<Settings></Settings>
			</GlobalProvider>
		</ConfigProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

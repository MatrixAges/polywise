import '@/styles/index.css'

import { useLayoutEffect, useMemo, useState } from 'react'
import { ConfigProvider, Splitter } from 'antd'
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

	const props_tab: IPropsTab = {
		is_panel_collapsed: settings.panel_collapsed,
		onExpand: settings.togglePanelCollapsed
	}

	const props_page: IPropsPage = {}

	const props_right_panel: IPropsPanel = {
		onClose: settings.togglePanelCollapsed
	}

	return (
		<ConfigProvider {...props_config_provider}>
			<GlobalProvider value={global}>
				<div className='flex h-screen w-full'>
					<Splitter
						className='h-full w-full'
						classNames={{
							dragger: 'opacity-0 hover:opacity-100'
						}}
						onCollapse={settings.handlePanelCollapse}
						onResize={settings.handlePanelResize}
					>
						<Splitter.Panel>
							<div className='flex h-full flex-1 flex-col'>
								<Tab {...props_tab}></Tab>
								<Page {...props_page}></Page>
							</div>
						</Splitter.Panel>
						<Splitter.Panel
							collapsible={{ start: true, showCollapsibleIcon: false }}
							defaultSize={settings.panel_width}
							min={0}
							size={settings.panel_collapsed ? 0 : settings.panel_width}
						>
							<Panel {...props_right_panel}></Panel>
						</Splitter.Panel>
					</Splitter>
				</div>
				<Settings></Settings>
			</GlobalProvider>
		</ConfigProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

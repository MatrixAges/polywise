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
	const panel_width_default = 320
	const panel_collapse_threshold = 240

	const [global] = useState(() => container.resolve(GlobalModel))
	const [panel_width, setPanelWidth] = useState(panel_width_default)
	const [is_panel_collapsed, setIsPanelCollapsed] = useState(false)

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

	const handleExpandPanel = () => {
		setPanelWidth(panel_width_default)
		setIsPanelCollapsed(false)
	}

	const props_tab: IPropsTab = {
		is_panel_collapsed,
		onExpand: handleExpandPanel
	}

	const props_page: IPropsPage = {}

	const props_right_panel: IPropsPanel = {
		onClose: () => setIsPanelCollapsed(true)
	}

	const handlePanelResize = (sizes: Array<number>) => {
		const next_panel_width = sizes[1]

		if (typeof next_panel_width !== 'number') {
			return
		}

		if (next_panel_width < panel_collapse_threshold) {
			setIsPanelCollapsed(true)
			setPanelWidth(panel_width_default)

			return
		}

		setPanelWidth(next_panel_width)
	}

	const handlePanelCollapse = (collapsed: Array<boolean>) => {
		const next_is_panel_collapsed = collapsed[1]

		if (typeof next_is_panel_collapsed !== 'boolean') {
			return
		}

		setIsPanelCollapsed(next_is_panel_collapsed)
	}

	return (
		<ConfigProvider {...props_config_provider}>
			<GlobalProvider value={global}>
				<div className='flex h-screen w-full'>
					<Splitter
						className='group/splitter h-full w-full'
						classNames={{
							dragger: '!bg-transparent !opacity-0 transition-opacity duration-150 [&_*]:!opacity-0 group-hover/splitter:!opacity-100 group-hover/splitter:[&_*]:!opacity-100 hover:!opacity-100 hover:[&_*]:!opacity-100 active:!opacity-100 active:[&_*]:!opacity-100'
						}}
						onCollapse={handlePanelCollapse}
						onResize={handlePanelResize}
					>
						<Splitter.Panel>
							<div className='flex h-full flex-1 flex-col'>
								<Tab {...props_tab}></Tab>
								<Page {...props_page}></Page>
							</div>
						</Splitter.Panel>
						<Splitter.Panel
							collapsible={{ start: true, showCollapsibleIcon: false }}
							defaultSize={panel_width_default}
							min={0}
							size={is_panel_collapsed ? 0 : panel_width}
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

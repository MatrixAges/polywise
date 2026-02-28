import '@/styles/index.css'

import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { GlobalProvider } from '@/context'
import GlobalModel from '@/models/Global'
import Settings from '@/settings'

import type { IPropsPage, IPropsPanel, IPropsTab } from './types'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))
	const settings = global.settings

	useLayoutEffect(() => {
		global.init()

		return () => global.off()
	}, [])

	const props_tab: IPropsTab = {
		is_panel_collapsed: settings.panel_collapsed,
		onExpand: settings.togglePanelCollapsed
	}

	const props_page: IPropsPage = {}

	const props_right_panel: IPropsPanel = {
		onClose: settings.togglePanelCollapsed
	}

	return (
		<GlobalProvider value={global}>
			<div className='flex h-screen w-full'></div>
			<Settings></Settings>
		</GlobalProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

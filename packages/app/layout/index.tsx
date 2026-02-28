import '@/styles/index.css'

import { useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useDefaultLayout } from 'react-resizable-panels'
import { local } from 'stk/storage'
import { container } from 'tsyringe'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/__shadcn__/components/ui/resizable'
import { PANEL_COLLAPSE_THRESHOLD, PANEL_WIDTH_DEFAULT } from '@/appdata'
import { GlobalModel, GlobalProvider } from '@/context'

import { Header, Panel } from './components'

import type { IPropsHeader, IPropsPanel } from './types'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))
	const { defaultLayout, onLayoutChanged: layoutChanged } = useDefaultLayout({
		id: 'layout'
	})

	const s = global.settings

	useLayoutEffect(() => {
		global.init()

		return () => global.off()
	}, [])

	const props_Header: IPropsHeader = {
		panel_collapsed: s.panel_collapsed,
		togglePanel: s.togglePanel
	}

	const props_panel: IPropsPanel = {
		togglePanel: s.togglePanel
	}

	const onLayoutChanged = useMemoizedFn((v: Record<string, number>) => {
		const { layout_panel } = v

		layoutChanged(v)

		if (!layout_panel) return

		local.layout_panel_last_width = layout_panel
	})

	return (
		<GlobalProvider value={global}>
			<div className='flex h-screen w-screen'>
				<ResizablePanelGroup defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
					<ResizablePanel id='layout_content' className='flex h-full flex-col'>
						<Header {...props_Header}></Header>
					</ResizablePanel>
					{!s.panel_collapsed && (
						<ResizableHandle
							className='
								bg-std-100/60
								transition-colors duration-200
								hover:bg-std-100 focus:bg-std-150
							'
						/>
					)}
					<ResizablePanel
						id='layout_panel'
						className='h-full'
						collapsible
						defaultSize={PANEL_WIDTH_DEFAULT}
						minSize={PANEL_COLLAPSE_THRESHOLD}
						maxSize='50'
						panelRef={s.setPanelRef}
						onResize={s.updatePanelState}
					>
						<Panel {...props_panel}></Panel>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		</GlobalProvider>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

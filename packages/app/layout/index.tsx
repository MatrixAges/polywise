import '@/styles/index.css'

import { useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { LucideProvider } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useDefaultLayout } from 'react-resizable-panels'
import { Outlet } from 'react-router'
import { local } from 'stk/storage'
import { container } from 'tsyringe'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/__shadcn__/components/ui/resizable'
import { PANEL_COLLAPSE_THRESHOLD, PANEL_WIDTH_DEFAULT } from '@/appdata'
import { Fallback } from '@/components'
import { GlobalModel, GlobalProvider } from '@/context'
import Panel from '@/panel'

import { Alert, Header } from './components'

import type { IPropsHeader } from './types'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))

	const { defaultLayout, onLayoutChanged: layoutChanged } = useDefaultLayout({ id: 'layout' })

	const s = global.setting

	useLayoutEffect(() => {
		global.init()

		return () => global.deinit()
	}, [])

	const props_header: IPropsHeader = {
		toggleSidebar: s.toggleSidebar,
		togglePanel: s.togglePanel
	}

	const onLayoutChanged = useMemoizedFn((v: Record<string, number>) => {
		const { layout_panel } = v

		layoutChanged(v)

		if (!layout_panel) return

		local.layout_panel_last_width = layout_panel
	})

	if (!global.ready) return <Fallback screen></Fallback>

	return (
		<LucideProvider size={14} strokeWidth={2}>
			<GlobalProvider value={global}>
				<Alert></Alert>
				<div
					className='
						overflow-hidden
						flex flex-col
						w-screen h-screen
						bg-layout-under
					'
				>
					<Header {...props_header}></Header>
					<div
						className='
							flex
							w-full h-[calc(100%-48px)]
							px-2.5
							pb-2.5
						'
					>
						<ResizablePanelGroup
							className='
								overflow-hidden
								h-full!
								rounded-sm
								bg-layout-over
								dark:border-border-light/60 dark:border
							'
							defaultLayout={defaultLayout}
							onLayoutChanged={onLayoutChanged}
						>
							<ResizablePanel
								id='layout_content'
								className='h-full'
								disabled={s.panel_collapsed}
							>
								<Outlet></Outlet>
							</ResizablePanel>
							{!s.panel_collapsed && (
								<ResizableHandle
									className='
										bg-border-light
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
								<Panel></Panel>
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				</div>
			</GlobalProvider>
		</LucideProvider>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

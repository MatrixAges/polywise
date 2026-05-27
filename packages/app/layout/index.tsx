import '@/styles/index.css'

import { IconContext } from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'
import { LucideProvider } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { IconContext as RCIconContext } from 'react-icons'
import { useDefaultLayout } from 'react-resizable-panels'
import { Outlet } from 'react-router'
import { local } from 'stk/storage'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/__shadcn__/components/ui/resizable'
import { Toaster } from '@/__shadcn__/components/ui/sonner'
import { TooltipProvider } from '@/__shadcn__/components/ui/tooltip'
import { PANEL_COLLAPSE_THRESHOLD, PANEL_WIDTH_DEFAULT } from '@/appdata'
import { Fallback } from '@/components'
import { useGlobal } from '@/context'
import Panel from '@/panel'
import PageBridge from '@/runtime/PageBridge'

import { Alert, Header } from './components'

import type { IPropsHeader } from './types'

const Index = () => {
	const global = useGlobal()

	const { defaultLayout, onLayoutChanged: layoutChanged } = useDefaultLayout({ id: 'layout' })

	const s = global.setting

	const props_header: IPropsHeader = {
		workspaces: $copy(s.config?.workspaces) || [],
		current_workspace: s.config?.current_workspace,
		disconnected: global.disconnected,
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
		<LucideProvider size={14} strokeWidth={1.6}>
			<IconContext.Provider value={{ size: 14, strokeWidth: 1.6 }}>
				<RCIconContext.Provider
					value={{ size: '14px', className: 'rc-icons', attr: { strokeWidth: 1.6 } }}
				>
					<TooltipProvider delay={600} closeDelay={300}>
						{s.config?.page_bridge_enabled && <PageBridge></PageBridge>}
						<Toaster
							position='top-center'
							toastOptions={{ duration: 3000 }}
							closeButton
							theme={global.theme.theme_value}
						></Toaster>
						<Alert></Alert>
						<div
							className='
								overflow-hidden
								flex flex-col
								w-screen h-screen
								bg-layout-under
								electron:bg-layout-under/12
							'
						>
							<Header {...props_header}></Header>
							<div
								className='
									flex
									w-full h-[calc(100%-42px)]
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
										<div data-page-root='route' className='h-full'>
											<Outlet></Outlet>
										</div>
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
					</TooltipProvider>
				</RCIconContext.Provider>
			</IconContext.Provider>
		</LucideProvider>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useState } from 'react'
import { Ellipsis, PanelRight, RotateCcw } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '@/__shadcn__/components/ui/dropdown-menu'
import { panel_tabs } from '@/appdata'
import { Lazy, Tabs } from '@/components'
import { useGlobal } from '@/context'

import Model from './model'

const Index = () => {
	const global = useGlobal()
	const [x] = useState(() => container.resolve(Model))

	const s = global.setting

	return (
		<div
			data-page-root='panel'
			className='
				flex flex-col
				w-full h-full
				bg-std-50/60
				dark:bg-std-50
			'
		>
			<div
				data-page-tabs='panel'
				className='
					flex
					items-center justify-between
					h-9
					px-1.5
				'
			>
				<Tabs small items={panel_tabs} active={x.active_tab} onClick={x.setActiveTab}></Tabs>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<div className='icon_button small'>
							<Ellipsis />
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent className='min-w-[150px]'>
						<DropdownMenuGroup>
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuItem onClick={s.resetPanal}>
								<RotateCcw></RotateCcw>
								Reset
							</DropdownMenuItem>
							<DropdownMenuItem onClick={s.togglePanel}>
								<PanelRight />
								Collapse
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className='flex flex-1 overflow-y-scroll'>
				<div className='flex w-full'>
					<Lazy type='panel' path={x.active_tab}></Lazy>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

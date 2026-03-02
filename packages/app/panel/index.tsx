import { Activity, useState } from 'react'
import { Ellipsis } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { panel_tabs } from '@/appdata'
import { Lazy, Tabs } from '@/components'

import Agent from './agent'
import Bookmark from './bookmark'
import Model from './model'
import Search from './search'
import Task from './task'

const map = {
	agent: Agent,
	search: Search,
	bookmark: Bookmark,
	task: Task
} as Record<string, typeof Agent>

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	return (
		<div className='flex h-full w-full flex-col'>
			<div
				className='
					flex
					items-center justify-between
					h-[42px]
					px-2
				'
			>
				<Tabs items={panel_tabs} active={x.active_tab} onClick={x.setActiveTab}></Tabs>
				<div className='icon_button'>
					<Ellipsis />
				</div>
			</div>
			<div className='flex h-[calc(100%-42px)] overflow-y-scroll'>
				<div className='flex w-full px-3 pb-12'>
					{panel_tabs.map(({ key }) => {
						const Component = map[key]

						return (
							<Activity mode={key === x.active_tab ? 'visible' : 'hidden'} key={key}>
								{/* <Component /> */}
								<Lazy type='panel' path={key}></Lazy>
							</Activity>
						)
					})}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

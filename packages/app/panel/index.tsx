import { useState } from 'react'
import { Ellipsis } from 'lucide-react'

import { panel_tabs } from '@/appdata'
import { Tabs } from '@/components'
import { memo } from '@/utils'

import type { IPropsPanel } from '../layout/types'

const Index = (props: IPropsPanel) => {
	const {} = props
	const [active_tab, setActiveTab] = useState('agent')

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
				<Tabs items={panel_tabs} active={active_tab} onClick={setActiveTab}></Tabs>
				<div className='icon_button'>
					<Ellipsis />
				</div>
			</div>
		</div>
	)
}

export default memo(Index)

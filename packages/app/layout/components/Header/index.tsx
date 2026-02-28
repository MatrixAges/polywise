import { House, PanelRight } from 'lucide-react'
import { ScrollMenu } from 'react-horizontal-scrolling-menu'

import { content_tabs } from '@/__metadata__'
import { is_mac_electron, memo, onWheel } from '@/utils'

import { TabItem } from './components'

import type { IPropsHeader } from '../../types'

const Index = (props: IPropsHeader) => {
	const { panel_collapsed, togglePanel } = props

	return (
		<div
			className={$cx(
				`
				flex
				items-center justify-between
				h-[42px]
				is_drag
			`,
				is_mac_electron && 'pl-[86px]'
			)}
		>
			<div
				className='
					flex
					items-center
					h-full
					px-3
					no_drag
				'
			>
				<div className='icon_button'>
					<House></House>
				</div>
				<ScrollMenu wrapperClassName='bg-amber-50' onWheel={onWheel}>
					{content_tabs.map(item => {
						return <TabItem {...item} key={item.type + item.title}></TabItem>
					})}
				</ScrollMenu>
			</div>
			{panel_collapsed && (
				<div className='icon_button mr-3' onClick={togglePanel}>
					<PanelRight></PanelRight>
				</div>
			)}
		</div>
	)
}

export default memo(Index)

import { House, PanelRight } from 'lucide-react'
import { ScrollMenu } from 'react-horizontal-scrolling-menu'

import { content_tabs } from '@/__metadata__'
import { is_mac_electron, is_win_electron, memo, onWheel } from '@/utils'

import { TabItem } from './components'

import styles from './index.module.css'

import type { IPropsHeader } from '../../types'

const Index = (props: IPropsHeader) => {
	const { panel_collapsed, togglePanel } = props
	const column_is_last = false
	const active_index = 2

	return (
		<div
			className={$cx(
				`
				flex
				items-center justify-between
				w-full h-[42px]
				border-std-100/60 border-b
				is_drag
			`,
				styles._local
			)}
		>
			<div
				className='
					flex
					items-center justify-center
					h-full
					px-2
					border-std-100/60 border-r
				'
			>
				<div className='icon_button'>
					<House></House>
				</div>
			</div>
			<ScrollMenu
				wrapperClassName={$cx(
					'scroll_wrap overflow-hidden',
					is_mac_electron && 'is_mac_electron',
					panel_collapsed && 'panel_collapsed',
					is_win_electron && column_is_last && 'column_is_last'
				)}
				scrollContainerClassName='items-center'
				onWheel={onWheel}
			>
				{content_tabs.map((item, index) => {
					return (
						<TabItem
							{...item}
							active={active_index === index}
							key={item.type + item.title}
						></TabItem>
					)
				})}
			</ScrollMenu>
			{panel_collapsed && (
				<div className='icon_button mr-3' onClick={togglePanel}>
					<PanelRight></PanelRight>
				</div>
			)}
		</div>
	)
}

export default memo(Index)

import { House, PanelRight } from 'lucide-react'

import { is_mac_electron, memo } from '@/utils'

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
			<div className='no_drag flex h-full'>
				<div
					className='
						aspect-square
						flex
						items-center justify-center
						h-full
						icon_button
					'
				>
					<House></House>
				</div>
			</div>
			{panel_collapsed && (
				<div
					className='
						flex
						items-center justify-center
						icon_button
					'
					onClick={togglePanel}
				>
					<PanelRight></PanelRight>
				</div>
			)}
		</div>
	)
}

export default memo(Index)

import { House, PanelRight } from 'lucide-react'

import { is_mac_electron, memo } from '@/utils'

import type { IPropsTab } from '../../types'

const Index = (props: IPropsTab) => {
	const { is_panel_collapsed, onExpand } = props

	return (
		<div
			className={$cx(
				`border-std-900/8 is_drag flex h-[36px] items-center justify-between border-b`,
				is_mac_electron && 'pl-[86px]'
			)}
		>
			<div className='no_drag flex h-full'>
				<div className='bg-std-100 border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r border-l shadow-[0_1px_0_0_var(--color-std-100)]'>
					<House size={16}></House>
				</div>
			</div>
			{is_panel_collapsed && (
				<div
					className='border-std-900/8 no_drag clickable flex h-full w-[37px] items-center justify-center border-l'
					onClick={onExpand}
				>
					<PanelRight size={16}></PanelRight>
				</div>
			)}
		</div>
	)
}

export default memo(Index)

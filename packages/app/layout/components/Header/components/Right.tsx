import { PanelRight, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router'

import type { IPropsRight } from '../types'

const Index = (props: IPropsRight) => {
	const { togglePanel } = props

	return (
		<div
			className='
				absolute
				right-2.5
				flex
				items-center
				gap-2
			'
		>
			<div
				className='
					w-auto!
					px-2
					icon_button
				'
			>
				<span className='h-1.5 w-1.5 rounded-full bg-green-600/60'></span>
				<span>Status</span>
			</div>
			<NavLink to='/setting'>
				{({ isActive }) => (
					<button className={$cx(`icon_button`, isActive && 'active')}>
						<SlidersHorizontal></SlidersHorizontal>
					</button>
				)}
			</NavLink>

			<button className='icon_button' onClick={togglePanel}>
				<PanelRight></PanelRight>
			</button>
		</div>
	)
}

export default $app.memo(Index)

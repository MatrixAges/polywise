import { PanelRight, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router'

// import SessionsStatus from './SessionsStatus'

import type { IPropsRight } from '../types'

const Index = (props: IPropsRight) => {
	const { disconnected, togglePanel } = props

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
			{/* <SessionsStatus></SessionsStatus> */}
			<div className='icon_button w-auto! px-2'>
				<span
					className={$cx(
						'h-1.5 w-1.5 rounded-full',
						disconnected ? 'bg-red-400' : 'bg-green-500/72'
					)}
				></span>
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

import { Fragment } from 'react'
import { PanelRight, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router'

import { is_win_electron } from '@/utils'

// import SessionsStatus from './SessionsStatus'
import Update from './Update'
import WinActions from './WinActions'

import type { IPropsRight } from '../types'

const Index = (props: IPropsRight) => {
	const { disconnected, togglePanel, update_status, downloadUpdate } = props

	return (
		<div
			className={$cx(
				`
				absolute
				right-2.5
				flex
				items-center
				gap-2
			`,
				is_win_electron && 'pr-20'
			)}
		>
			{/* <SessionsStatus></SessionsStatus> */}
			<Update update_status={update_status} downloadUpdate={downloadUpdate}></Update>
			<div className='icon_button w-auto! px-2'>
				<span
					className={$cx(
						'h-1.5 w-1.5 rounded-full',
						disconnected ? 'bg-red-400' : 'bg-green-500/72'
					)}
				></span>
				<span>Status</span>
			</div>
			<NavLink className='no_drag' to='/setting'>
				{({ isActive }) => (
					<button className={$cx(`icon_button`, isActive && 'active')}>
						<SlidersHorizontal></SlidersHorizontal>
					</button>
				)}
			</NavLink>
			<button className='icon_button no_drag' onClick={togglePanel}>
				<PanelRight></PanelRight>
			</button>
			{is_win_electron && (
				<Fragment>
					<div
						className='
							w-px h-[14px]
							mx-3
							ml-2
							bg-under/16
						'
					></div>
					<WinActions></WinActions>
				</Fragment>
			)}
		</div>
	)
}

export default $app.memo(Index)

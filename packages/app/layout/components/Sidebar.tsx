import { Settings } from 'lucide-react'

import { nav_items } from '@/appdata'
import Logo from '@/svgs/bare.svg?react'
import { memo } from '@/utils'

import type { IPropsSidebar } from '../types'

const Index = (props: IPropsSidebar) => {
	const { toggleSettings } = props

	return (
		<nav
			className='
				relative
				flex flex-col
				items-center justify-center
				w-18 h-screen
				is_drag
			'
		>
			<div
				className='
					absolute
					top-2
					flex
					items-center justify-center
					w-full h-12
					p-4.5
					fill-std-800
				'
			>
				<Logo></Logo>
			</div>
			<div
				className='
					flex flex-col
					items-center
					gap-3
				'
			>
				{nav_items.map(({ key, Icon }) => (
					<div
						className='
							flex
							items-center justify-center
							w-12 h-12
							rounded-full
							hover:bg-std-300/60 hover:text-std-900
							no_drag clickable
						'
						key={key}
					>
						<Icon size={20}></Icon>
					</div>
				))}
			</div>
			<div
				className='
					absolute
					bottom-3
					flex
					items-center justify-center
					w-12 h-12
					rounded-full
					text-xl
					hover:bg-std-300/60 hover:text-std-900
					no_drag clickable
				'
				onClick={toggleSettings}
			>
				<Settings size={20}></Settings>
			</div>
		</nav>
	)
}

export default memo(Index)

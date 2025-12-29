import { Settings } from 'lucide-react'

import { nav_items } from '@/appdata'
import Logo from '@/svgs/bare.svg?react'
import { memo } from '@/utils'

import type { IPropsSidebar } from '../types'

const Index = (props: IPropsSidebar) => {
	const { openSettings } = props

	return (
		<nav
			className='
				relative
				flex flex-col
				items-center justify-center
				w-16 h-screen
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
					p-4
					fill-std-200
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
				{nav_items.map(({ key, Icon }, index) => (
					<div
						className='
							flex
							items-center justify-center
							w-10 h-10
							rounded-full
							hover:bg-std-700 hover:text-std-100
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
					w-10 h-10
					rounded-full
					text-xl text-std-400
					hover:bg-std-600 hover:text-std-100
					no_drag clickable
				'
				onClick={openSettings}
			>
				<Settings size={20}></Settings>
			</div>
		</nav>
	)
}

export default memo(Index)

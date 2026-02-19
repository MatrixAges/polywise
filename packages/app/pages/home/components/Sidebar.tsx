import { Settings } from 'lucide-react'

import { nav_items } from '@/appdata'
import Logo from '@/svgs/bare.svg?react'
import { memo } from '@/utils'

import type { IPropsSidebar } from '../types'

const Index = (props: IPropsSidebar) => {
	const { toggleSettings } = props

	return (
		<nav className='relative flex h-full w-18 flex-col items-center justify-center'>
			<div className='absolute top-4 flex items-center justify-center px-4'>
				<div className='fill-std-800 flex h-9 w-9 items-center justify-center'>
					<Logo></Logo>
				</div>
			</div>
			<div className='flex flex-col items-center gap-3'>
				{nav_items.map(({ key, Icon }) => (
					<div
						className='hover:bg-std-300/60 hover:text-std-900 clickable flex h-12 w-12 items-center justify-center rounded-full'
						key={key}
					>
						<Icon size={20}></Icon>
					</div>
				))}
			</div>
			<div
				className='hover:bg-std-300/60 hover:text-std-900 clickable absolute bottom-3 flex h-12 w-12 items-center justify-center rounded-full text-xl'
				onClick={toggleSettings}
			>
				<Settings size={20}></Settings>
			</div>
		</nav>
	)
}

export default memo(Index)

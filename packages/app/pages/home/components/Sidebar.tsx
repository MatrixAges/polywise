import { Settings } from 'lucide-react'

import { nav_items } from '@/appdata'
import { useGlobal } from '@/context'
import Logo from '@/public/bare.svg?react'
import { memo } from '@/utils'

import type { IPropsSidebar } from '../types'

const Index = (props: IPropsSidebar) => {
	const { toggleSettings } = props
	const { settings } = useGlobal()

	const handleNavClick = (key: string) => {}

	return (
		<nav
			className='
				relative
				flex flex-col
				items-center justify-center
				w-18 h-full
			'
		>
			<div
				className='
					absolute
					top-4
					flex
					items-center justify-center
					px-4
				'
			>
				<div
					className='
						flex
						items-center justify-center
						w-9 h-9
						fill-std-800
					'
				>
					<Logo></Logo>
				</div>
			</div>
			<div className='flex flex-col items-center gap-3'>
				{nav_items.map(({ key, Icon }) => (
					<div
						className='
							flex
							items-center justify-center
							w-12 h-12
							rounded-full
							hover:bg-std-300/60 hover:text-std-900
							clickable
						'
						key={key}
						onClick={() => handleNavClick(key)}
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
					clickable
				'
				onClick={toggleSettings}
			>
				<Settings size={20}></Settings>
			</div>
		</nav>
	)
}

export default memo(Index)

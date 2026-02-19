import { PanelLeftOpen, PanelRightOpen, Settings } from 'lucide-react'

import { nav_items } from '@/appdata'
import Logo from '@/svgs/bare.svg?react'
import { memo } from '@/utils'

import type { IPropsSidebar } from '@/layout/types'

const Index = (props: IPropsSidebar) => {
	const { fold, toggleSidebar, toggleSettings } = props

	return (
		<nav
			className={`relative flex h-full flex-col ${fold ? 'w-18 items-center justify-center' : 'border-std-900/8 w-60 border-r py-2'} `}
		>
			<div
				className={`group flex items-center px-4 ${fold ? 'absolute top-4 justify-center' : 'border-std-900/8 justify-between border-b pb-2'} `}
			>
				<div
					className={`fill-std-800 flex items-center justify-center ${fold ? 'h-8 w-8 group-hover:opacity-0' : 'h-6 w-6'} `}
				>
					<Logo></Logo>
				</div>
				<div
					className={`hover:bg-std-300/60 hover:text-std-900 clickable flex h-8 w-8 items-center justify-center rounded-full ${fold ? 'absolute opacity-0 group-hover:opacity-100' : '-mr-1.5'} `}
					onClick={toggleSidebar}
				>
					{fold ? (
						<PanelLeftOpen size={16}></PanelLeftOpen>
					) : (
						<PanelRightOpen size={16}></PanelRightOpen>
					)}
				</div>
			</div>
			<div className={`flex flex-col ${fold ? 'items-center gap-3' : 'px-1 py-2'} `}>
				{nav_items.map(({ key, Icon }) => (
					<div
						className={`hover:bg-std-300/60 hover:text-std-900 clickable flex h-12 items-center ${fold ? 'w-12 justify-center rounded-full' : 'gap-4 rounded-full px-3.5'} `}
						key={key}
					>
						<Icon size={fold ? 20 : 18}></Icon>
						{!fold && <span className='capitalize'>{key}</span>}
					</div>
				))}
			</div>
			<div
				className={`hover:bg-std-300/60 hover:text-std-900 clickable absolute flex h-12 items-center ${
					fold
						? `bottom-3 w-12 justify-center rounded-full text-xl`
						: `border-std-900/8 bottom-0 w-full gap-2 border-t px-4.5`
				} `}
				onClick={toggleSettings}
			>
				<Settings size={fold ? 20 : 18}></Settings>
				{!fold && <span className='capitalize'>Settings</span>}
			</div>
		</nav>
	)
}

export default memo(Index)

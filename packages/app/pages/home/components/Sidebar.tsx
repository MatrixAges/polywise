import { PanelLeftOpen, PanelRightOpen, Settings } from 'lucide-react'

import { nav_items } from '@/appdata'
import Logo from '@/svgs/bare.svg?react'
import { memo } from '@/utils'

import type { IPropsSidebar } from '../types'

const Index = (props: IPropsSidebar) => {
	const { fold, toggleSidebar, toggleSettings } = props

	return (
		<nav
			className={`
				relative
				flex flex-col
				h-full
				${fold ? 'w-18 items-center justify-center' : 'border-std-900/8 w-60 border-r py-2'}
			`}
		>
			<div
				className={`
					flex
					items-center
					px-4
					group
					${fold ? 'absolute top-4 justify-center' : 'border-std-900/8 justify-between border-b pb-2'}
                        `}
			>
				<div
					className={`
						flex
						items-center justify-center
						fill-std-800
						${fold ? 'h-8 w-8 group-hover:opacity-0' : 'h-6 w-6'}
					`}
				>
					<Logo></Logo>
				</div>
				<div
					className={`
						flex
						items-center justify-center
						w-8 h-8
						rounded-full
						hover:bg-std-300/60 hover:text-std-900
						clickable
						${fold ? 'absolute opacity-0 group-hover:opacity-100' : '-mr-1.5'}
					`}
					onClick={toggleSidebar}
				>
					{fold ? (
						<PanelLeftOpen size={16}></PanelLeftOpen>
					) : (
						<PanelRightOpen size={16}></PanelRightOpen>
					)}
				</div>
			</div>
			<div
				className={`
					flex flex-col
					${fold ? 'items-center gap-3' : 'px-1 py-2'}
				`}
			>
				{nav_items.map(({ key, Icon }) => (
					<div
						className={`
							flex
							items-center
							h-12
							hover:bg-std-300/60 hover:text-std-900
							clickable
							${fold ? 'w-12 justify-center rounded-full' : 'gap-4 rounded-full px-3.5'}
						`}
						key={key}
					>
						<Icon size={fold ? 20 : 18}></Icon>
						{!fold && <span className='capitalize'>{key}</span>}
					</div>
				))}
			</div>
			<div
				className={`
					absolute
					flex
					items-center
					h-12
					hover:bg-std-300/60 hover:text-std-900
					clickable
					${
						fold
							? `
					bottom-3
					justify-center
					w-12
					rounded-full
					text-xl
				`
							: `
					bottom-0
					w-full
					gap-2
					px-4.5
					border-std-900/8 border-t
				`
					}
				`}
				onClick={toggleSettings}
			>
				<Settings size={fold ? 20 : 18}></Settings>
				{!fold && <span className='capitalize'>Settings</span>}
			</div>
		</nav>
	)
}

export default memo(Index)

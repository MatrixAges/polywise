import { useState } from 'react'
import { PanelLeft, PanelRight, SlidersHorizontal } from 'lucide-react'

import { nav_items } from '@/appdata'
import Logo from '@/public/bare.svg?react'

const Index = () => {
	const [active_tab, set_active_tab] = useState('agent')

	return (
		<div
			className='
				relative
				flex
				items-center justify-center
				w-full h-[43px]
				border-std-100/80 border-b
			'
		>
			<div
				className='
					absolute
					left-3
					flex
					items-center
					h-full
				'
			>
				<div
					className='
						flex
						items-center justify-center
						w-5 h-5
						transition-all
						hover:fill-std-black
						fill-std-300
					'
				>
					<Logo width='100%' height='100%'></Logo>
				</div>
				<div
					className='
						w-px h-[14px]
						ml-4 mr-3
						bg-std-100/80
					'
				></div>
				<button className='icon_button'>
					<PanelLeft></PanelLeft>
				</button>
			</div>
			<div className='flex items-center'>
				<div
					className='
						flex
						items-center
						h-9
						gap-1.5
						text-xs
					'
				>
					{nav_items.map(({ key, Icon }) => (
						<div
							className={$cx(
								`
								flex
								items-center justify-center
								h-7
								gap-1
								rounded-full
								hover:bg-std-100
								clickable
							`,
								active_tab === key
									? 'text-std-black bg-std-100 px-2'
									: 'text-std-400/80 w-7'
							)}
							key={key}
							onClick={() => set_active_tab(key)}
						>
							<Icon size={14} />
							{active_tab === key && <span className='capitalize'>{key}</span>}
						</div>
					))}
				</div>
			</div>
			<div
				className='
					absolute
					right-2
					flex
					items-center
					gap-2
				'
			>
				<button className='icon_button'>
					<SlidersHorizontal></SlidersHorizontal>
				</button>
				<button className='icon_button'>
					<PanelRight></PanelRight>
				</button>
			</div>
		</div>
	)
}

export default $app.memo(Index)

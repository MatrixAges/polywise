import { X } from 'lucide-react'

import { nav_icon_map } from '@/appdata'
import { useScrollToItem } from '@/hooks'
import { memo } from '@/utils'

import type { IPropsTabItem } from '../types'

const Index = (props: IPropsTabItem) => {
	const { type, title, active } = props
	const Icon = nav_icon_map[type]

	// useScrollToItem(type + title, false, false)

	return (
		<div
			className={$cx(
				`
				relative
				overflow-hidden
				flex
				items-center
				h-full
				gap-1
				px-3
				text-sm text-std-400/80
				border-std-100/60 border-l
				group
				hover:text-std-black
				tab_item capitalize lightclick
			`,
				active && 'text-std-black bg-std-50'
			)}
			title={title}
		>
			<span className='shrink-0'>
				<Icon size={12} />
			</span>
			<span className='max-w-[150px] overflow-hidden whitespace-nowrap'>{title}</span>
			<span
				className={$cx(
					`
					absolute
					top-1/2 right-1
					flex
					items-center justify-end
					w-10 h-6
					bg-linear-to-l
					from-std-white via-std-white to-transparent
					opacity-0
					group-hover:opacity-100
					-translate-y-1/2 pointer-events-none
				`,
					active && 'from-std-50! via-std-50! opacity-100'
				)}
			>
				<span
					className='
						flex shrink-0
						items-center justify-center
						w-5 h-5
						rounded-full
						text-std-400
						hover:bg-std-100
						clickable pointer-events-auto
					'
				>
					<X size={14} />
				</span>
			</span>
		</div>
	)
}

export default memo(Index)

import { useDelegate } from '@/hooks'

import type { LucideIcon } from 'lucide-react'
import type { FC } from 'react'
import type { IconType } from 'react-icons'

type TabItem = string | { key: string; title: string; Icon?: LucideIcon | IconType | FC<any> }

interface IProps {
	items: Array<TabItem>
	active: string
	className?: string
	itemClassName?: string
	setActive: (v: any) => void
}

const Index = (props: IProps) => {
	const { items, active, className, itemClassName, setActive } = props

	const ref_tab = useDelegate(v => setActive(v), { item_type: 'span' })

	return (
		<div
			className={$cx(
				`
				flex
				items-center
				h-full
				gap-1
				pt-px
				text-xsm text-std-400 font-medium
			`,
				className
			)}
			ref={ref_tab}
		>
			{items.map(item => {
				const key = typeof item === 'string' ? item : item.key
				const title = typeof item === 'string' ? item : item.title
				const Icon = typeof item === 'string' ? null : item.Icon

				return (
					<span
						className={$cx(
							`
						flex
						items-center
						h-full
						gap-1.5
						px-1
						mb-[-2px]
						border-b border-transparent
						clickable capitalize
					`,
							active === key && 'text-std-800 border-std-black! font-semibold',
							itemClassName
						)}
						data-key={key}
						data-tab-key={key}
						key={key}
					>
						{Icon && <Icon className='size-3.5 shrink-0' />}
						{title}
					</span>
				)
			})}
		</div>
	)
}

export default $app.memo(Index)

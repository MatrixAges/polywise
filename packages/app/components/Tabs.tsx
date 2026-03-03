import { useMemoizedFn } from 'ahooks'

import type { LucideIcon } from 'lucide-react'
import type { DependencyList } from 'react'

interface Item {
	key: string
	title?: string
	Icon?: LucideIcon
}

interface IProps {
	items: Array<Item>
	active?: string | ((v: string) => boolean)
	deps?: DependencyList
	onClick?: (v: string, item: Item) => void
}

const Index = (props: IProps) => {
	const { items, active, onClick } = props

	const getActive = useMemoizedFn((v: string) => {
		if (!active) return

		if (typeof active === 'string') {
			return v === active
		} else {
			return active(v)
		}
	})

	return (
		<div
			className='
				flex
				items-center
				h-7
				gap-1.5
				text-xs
			'
		>
			{items.map(item => {
				const { key, Icon, title } = item

				return (
					<div
						className={$cx(
							`
						flex
						items-center justify-center
						h-7
						gap-1
						rounded-full
						hover:bg-std-100 active:bg-std-150
						clickable
					`,
							getActive(key) ? 'text-std-black bg-std-100 px-2' : 'text-std-400/80 w-7'
						)}
						onClick={() => onClick?.(key, item)}
						key={key}
					>
						{Icon && <Icon size={14} />}
						{getActive(key) && <span className='font-medium capitalize'>{key || title}</span>}
					</div>
				)
			})}
		</div>
	)
}

export default $app.memo(Index)

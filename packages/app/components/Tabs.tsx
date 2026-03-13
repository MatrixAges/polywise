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
	under?: boolean

	deps?: DependencyList
	onClick?: (v: string, item: Item) => void
}

const Index = (props: IProps) => {
	const { items, active, under, onClick } = props

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
						w-7 h-7
						gap-1
						rounded-full
						clickable data-[active=true]:px-2 data-[active=true]:w-auto
					`,
							under
								? `
						text-under/60
						hover:bg-under/10 active:bg-under/16
						data-[active=true]:bg-under/10 data-[active=true]:text-under/80
					`
								: `
						text-std-400/80
						hover:bg-std-100 active:bg-std-150
						data-[active=true]:bg-std-100 data-[active=true]:text-std-black
					`
						)}
						onClick={() => onClick?.(key, item)}
						data-active={getActive(key)}
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

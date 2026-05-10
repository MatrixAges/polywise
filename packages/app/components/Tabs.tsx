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
	simple?: boolean
	small?: boolean
	onClick?: (v: string, item: Item) => void
}

const Index = (props: IProps) => {
	const { items, active, under, simple, small, onClick } = props

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
						rounded-full
						clickable
					`,
							`
						${simple || small ? 'h-6 w-6' : 'h-7 w-7'}
						gap-1
						data-[active=true]:w-auto
						${small ? 'data-[active=true]:px-2' : 'data-[active=true]:px-2.5'}
					`,
							under
								? `
						text-under/60
						hover:bg-under/10 active:bg-under/16
						data-[active=true]:bg-under/10 data-[active=true]:text-under
					`
								: `
						text-std-400/80
						hover:bg-active active:bg-click
						data-[active=true]:bg-active data-[active=true]:text-std-900
					`,
							simple && 'w-6! px-0!'
						)}
						title={key || title}
						data-active={getActive(key)}
						onClick={() => onClick?.(key, item)}
						key={key}
					>
						{Icon && <Icon size={small || simple ? 12 : 14} />}
						{!simple && getActive(key) && (
							<span className={$cx('font-medium capitalize', small && 'text-xs')}>
								{key || title}
							</span>
						)}
					</div>
				)
			})}
		</div>
	)
}

export default $app.memo(Index)

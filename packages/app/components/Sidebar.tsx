import { Fragment } from 'react'

import type { ElementType } from 'react'

interface Item {
	key: string
	Icon: ElementType
	title?: string
}

interface IProps<T extends Item = Item> {
	groups: Array<{ label: string; items: Array<T> }>
	current: string
	setCurrent: (v: string, item: T) => void
}

const Index = (props: IProps) => {
	const { groups, current, setCurrent } = props

	return (
		<div
			className='
				overflow-y-scroll
				flex
				w-[222px] h-full
			'
		>
			<div
				className='
					flex flex-col
					w-full
					gap-1
					px-2
					pb-12
				'
			>
				{groups.map(({ label, items }, index) => (
					<Fragment key={index}>
						{label && (
							<span
								className='
									flex
									items-center
									px-2.5 py-1.5
									text-xs text-muted-foreground
									capitalize
								'
							>
								{label}
							</span>
						)}
						{items.map(item => {
							const { key, title, Icon } = item

							return (
								<div
									className={$cx('click_button', current === key && 'active')}
									onClick={() => setCurrent(key, item)}
									key={key}
								>
									<Icon></Icon>
									<span className='capitalize'>{title || key}</span>
								</div>
							)
						})}
					</Fragment>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)

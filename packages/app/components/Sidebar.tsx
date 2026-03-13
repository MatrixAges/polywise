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
	width?: number
	setCurrent: (v: string, item: T) => void
}

const Index = (props: IProps) => {
	const { groups, current, width = 222, setCurrent } = props

	return (
		<div
			className='
				overflow-y-scroll
				flex
				w-full h-full
				border-border-light border-r
			'
			style={{ width }}
		>
			<div
				className='
					flex flex-col
					w-full
					gap-1
					px-2.5 pt-2.5
					pb-12
				'
			>
				{groups.map(({ items }, index) => (
					<Fragment key={index}>
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

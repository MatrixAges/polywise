import { useMemo } from 'react'

import { menu_items } from '../../metadata'
import Item from './Item'
import Latest from './Latest'

import styles from './index.module.css'

import type { IPropsMenu } from '../../types'

const Index = (props: IPropsMenu) => {
	const { editor, current_menu_items, latest_menu_items, onMenuItem } = props

	const latest = useMemo(
		() => latest_menu_items.map(index => ({ ...menu_items[index], index })),
		[latest_menu_items]
	)

	return (
		<div className={$cx('flex_column border_box relative flex', styles._local)}>
			<div
				className={`
					flex flex_column
					border_box
					menu_wrap w_100
				`}
			>
				<If condition={latest.length > 0}>
					<Latest items={latest} onMenuItem={onMenuItem}></Latest>
				</If>
				<div
					className={`
						flex flex_column
						border_box
						menu_items w_100
					`}
				>
					{current_menu_items.map((item, index) => (
						<Item item={item} index={index} onMenuItem={onMenuItem} key={item.key} />
					))}
				</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

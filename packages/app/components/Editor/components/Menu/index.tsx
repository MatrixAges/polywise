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
		<div className={$cx('relative box-border flex flex-col', styles._local)}>
			<div
				className={`
					box-border
					flex flex-col
					w-full
					menu_wrap
				`}
			>
				<If condition={latest.length > 0}>
					<Latest items={latest} onMenuItem={onMenuItem}></Latest>
				</If>
				<div
					className={`
						box-border
						flex flex-col
						w-full
						menu_items
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

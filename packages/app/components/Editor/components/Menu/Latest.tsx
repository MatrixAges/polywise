import { Icon } from '@/components'

import type { IPropsMenuLatest } from '../../types'

const Index = (props: IPropsMenuLatest) => {
	const { items, onMenuItem } = props

	return (
		<div
			className={`
				sticky
				flex
				top_0 latest_blocks align_center
			`}
		>
			{items.map(item => (
				<span
					className={`
						flex
						latest_block justify_center align_center clickable
					`}
					key={item.shortcut}
					onClick={() => onMenuItem(item.index)}
				>
					<Icon id={item.icon}></Icon>
				</span>
			))}
		</div>
	)
}

export default $app.memo(Index)

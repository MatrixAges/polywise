import { Icon } from '@/components'

import type { IPropsMenuLatest } from '../../types'

const Index = (props: IPropsMenuLatest) => {
	const { items, onMenuItem } = props

	return (
		<div
			className={`
				sticky
				top-0
				flex
				items-center
				latest_blocks
			`}
		>
			{items.map(item => (
				<span
					className={`
						flex
						items-center justify-center
						latest_block cursor-pointer
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

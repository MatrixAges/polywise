import { nav_icon_map } from '@/appdata'
import { useScrollToItem } from '@/hooks'
import { memo } from '@/utils'

import type { IPropsTabItem } from '../types'

const Index = (props: IPropsTabItem) => {
	const { type, title } = props
	const Icon = nav_icon_map[type]

	// useScrollToItem(type + title, false, false)

	return (
		<div className='inline-block'>
			<div className='flex items-center whitespace-nowrap'>
				<Icon></Icon>
				<span>{title}</span>
			</div>
		</div>
	)
}

export default memo(Index)

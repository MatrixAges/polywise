import BaseItem from '@/pages/session/components/Item'

import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessionItem) => {
	const { item, pin, selected, renaming, rename_value, session_index } = props

	return (
		<BaseItem
			item={item}
			pin={pin}
			selected={selected}
			renaming={renaming}
			rename_value={rename_value}
			title={<span className='truncate'>{item.title}</span>}
			group_index={-1}
			session_index={session_index}
		></BaseItem>
	)
}

export default $app.memo(Index)

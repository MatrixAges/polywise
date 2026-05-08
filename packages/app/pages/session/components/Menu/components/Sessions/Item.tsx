import BaseItem from '@/pages/session/components/Item'

import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessionItem) => {
	const { item, pin, selected, renaming, renameValue, sessionIndex } = props

	return (
		<BaseItem
			item={item}
			pin={pin}
			selected={selected}
			renaming={renaming}
			renameValue={renameValue}
			title={<span className='truncate'>{item.title}</span>}
			groupIndex={-1}
			sessionIndex={sessionIndex}
		></BaseItem>
	)
}

export default $app.memo(Index)

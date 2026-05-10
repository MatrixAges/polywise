import BaseItem from '@/pages/session/components/Item'

import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessionItem) => {
	const { item, pin, selected, renaming, renameValue, sessionIndex, className, style } = props

	return (
		<BaseItem
			item={item}
			pin={pin}
			selected={selected}
			renaming={renaming}
			renameValue={renameValue}
			title={<span className='truncate'>{item.title}</span>}
			sessionIndex={sessionIndex}
			className={className}
			style={style}
		></BaseItem>
	)
}

export default $app.memo(Index)

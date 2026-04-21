import BaseItem from '@/pages/session/components/Item'

import ItemMenu from './ItemMenu'

import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessionItem) => {
	const { item, groups, pin, selected, renaming, rename_value } = props

	return (
		<BaseItem
			item={item}
			pin={pin}
			selected={selected}
			renaming={renaming}
			rename_value={rename_value}
			title={<span className='truncate'>{item.title}</span>}
			menu={<ItemMenu item={item} groups={groups} pin={pin}></ItemMenu>}
		></BaseItem>
	)
}

export default $app.memo(Index)

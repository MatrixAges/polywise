import BaseItem from '@/pages/session/components/Item'

import ItemMenu from './ItemMenu'

import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessionItem) => {
	const { item, groups, pin_map, selected_session_id, rename_session_id, rename_value } = props

	return (
		<BaseItem
			item={item}
			pin_map={pin_map}
			selected_session_id={selected_session_id}
			rename_session_id={rename_session_id}
			rename_value={rename_value}
			title={<span className='truncate'>{item.title}</span>}
			menu={<ItemMenu item={item} groups={groups} pin_map={pin_map}></ItemMenu>}
		></BaseItem>
	)
}

export default $app.memo(Index)

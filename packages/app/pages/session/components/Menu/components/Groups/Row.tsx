import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import BaseItem from '@/pages/session/components/Item'

import RowMenu from './RowMenu'

import type { IPropsGroupSessionRow, IPropsGroupSessionRowMenu } from './types'

const Index = (props: IPropsGroupSessionRow) => {
	const {
		group_index,
		session_index,
		item,
		group_items_count,
		groups,
		pin_map,
		selected_session_id,
		renaming,
		rename_value
	} = props

	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id })

	const props_row_menu: IPropsGroupSessionRowMenu = {
		group_index,
		session_index,
		group_items_count,
		item,
		groups,
		pin_map
	}

	return (
		<BaseItem
			item={item}
			pin_map={pin_map}
			selected={selected_session_id === item.id}
			renaming={renaming}
			rename_value={rename_value}
			title={
				<span className='cursor-grab truncate' {...attributes} {...listeners}>
					{item.title}
				</span>
			}
			menu={<RowMenu {...props_row_menu}></RowMenu>}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			node_ref={setNodeRef}
		></BaseItem>
	)
}

export default $app.memo(Index)

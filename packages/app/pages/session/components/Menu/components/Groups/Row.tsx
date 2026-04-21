import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import BaseItem from '@/pages/session/components/Item'

import RowMenu from './RowMenu'

import type { IPropsGroupSessionRow, IPropsGroupSessionRowMenu } from './types'

const Index = (props: IPropsGroupSessionRow) => {
	const { group_index, session_index, item, group_items_count, groups, pin, selected, renaming, rename_value } =
		props

	const { attributes, listeners, transform, isDragging, setNodeRef } = useSortable({
		id: item.id
	})

	const props_row_menu: IPropsGroupSessionRowMenu = {
		group_index,
		session_index,
		group_items_count,
		item,
		groups,
		pin
	}

	const Title = useMemo(
		() => (
			<span
				className='cursor-grab truncate transition-none'
				ref={setNodeRef}
				{...attributes}
				{...listeners}
			>
				{item.title}
			</span>
		),
		[item.title]
	)

	return (
		<BaseItem
			item={item}
			pin={pin}
			selected={selected}
			renaming={renaming}
			rename_value={rename_value}
			title={Title}
			menu={<RowMenu {...props_row_menu}></RowMenu>}
			className={isDragging ? 'dragging z-10 backdrop-blur-lg' : ''}
			style={{
				transform: CSS.Translate.toString(transform),
				transition: ''
			}}
		></BaseItem>
	)
}

export default $app.memo(Index)

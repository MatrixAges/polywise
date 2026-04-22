import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import BaseItem from '@/pages/session/components/Item'

import type { IPropsGroupSessionRow } from './types'

const Index = (props: IPropsGroupSessionRow) => {
	const { group_index, session_index, item, pin, selected, renaming, rename_value } = props

	const { attributes, listeners, transform, isDragging, setNodeRef } = useSortable({
		id: item.id
	})

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
			group_index={group_index}
			session_index={session_index}
			className={isDragging ? 'dragging z-10 backdrop-blur-lg' : ''}
			style={{
				transform: CSS.Translate.toString(transform),
				transition: ''
			}}
		></BaseItem>
	)
}

export default $app.memo(Index)

import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import BaseItem from '@/pages/session/components/Item'

import type { IPropsGroupSessionRow } from './types'

const Index = (props: IPropsGroupSessionRow) => {
	const { groupIndex, sessionIndex, item, pin, selected, renaming, renameValue } = props

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
			renameValue={renameValue}
			title={Title}
			groupIndex={groupIndex}
			sessionIndex={sessionIndex}
			className={isDragging ? 'dragging z-10 backdrop-blur-lg' : ''}
			style={{
				transform: CSS.Translate.toString(transform),
				transition: ''
			}}
		></BaseItem>
	)
}

export default $app.memo(Index)

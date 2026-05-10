import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import Item from './Item'

import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessionItem) => {
	const { item } = props
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item.id
	})

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			className={$cx(isDragging && 'z-10')}
			{...attributes}
			{...listeners}
		>
			<Item
				{...props}
				className={$cx('cursor-grab active:cursor-grabbing', isDragging && 'dragging backdrop-blur-lg')}
			></Item>
		</div>
	)
}

export default $app.memo(Index)

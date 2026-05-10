import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import SessionMenuItem from './SessionMenuItem'

import type { IPropsSessionMenuItem } from '../types'

const Index = (props: IPropsSessionMenuItem) => {
	const { item } = props
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item.id
	})

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			className={$cx('cursor-grab active:cursor-grabbing', isDragging && 'dragging z-10 backdrop-blur-lg')}
			{...attributes}
			{...listeners}
		>
			<SessionMenuItem {...props}></SessionMenuItem>
		</div>
	)
}

export default $app.memo(Index)

import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'

import { useMenuContext } from '@/pages/session/context'

import Card from './Card'

import type { IPropsGroups } from '../../../../types'
import type { IPropsGroupCard, TDragEndEvent } from './types'

const Index = (props: IPropsGroups) => {
	const { groups, pin_map, selected_session_id, rename_group_index, rename_session_index, rename_value } = props
	const { sortGroup } = useMenuContext()

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const dragGroupEnd = useMemoizedFn((args: TDragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = groups.findIndex((_, index) => `group-${index}` === active.id)
		const to = groups.findIndex((_, index) => `group-${index}` === over.id)

		if (from < 0 || to < 0) {
			return
		}

		sortGroup(from, to)
	})

	const props_card: Omit<IPropsGroupCard, 'group_index' | 'group_name' | 'items'> = {
		groups,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_index,
		rename_value
	}

	return (
		<div
			className='
				overflow-y-scroll
				flex flex-col
				w-full h-full
				px-1.5
			'
		>
			<div
				className='
					flex flex-col
					gap-3
					pt-0.5
					pb-3
				'
			>
				<DndContext sensors={sensors} onDragEnd={dragGroupEnd}>
					<SortableContext
						items={groups.map((_, index) => `group-${index}`)}
						strategy={verticalListSortingStrategy}
					>
						{groups.map((group_item, group_index) => (
							<Card
								group_index={group_index}
								group_name={group_item.group}
								items={group_item.items}
								{...props_card}
								key={`${group_item.group}-${group_index}`}
							></Card>
						))}
					</SortableContext>
				</DndContext>
			</div>
		</div>
	)
}

export default $app.memo(Index)

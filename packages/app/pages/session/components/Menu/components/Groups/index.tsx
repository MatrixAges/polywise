import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '@/__shadcn__/components/ui/context-menu'
import { useMenuContext } from '@/pages/session/context'

import Card from './Card'

import type { IPropsGroups } from '../../../../types'
import type { IPropsGroupCard, TDragEndEvent } from './types'

const Index = (props: IPropsGroups) => {
	const { groups, pin_map, selected_session_id, rename_group_index, rename_session_id, rename_value } = props
	const actions = useMenuContext()

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

		actions.sortGroup(from, to)
	})

	const props_card: Omit<IPropsGroupCard, 'group_index' | 'group_name' | 'items'> = {
		groups,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_id,
		rename_value
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className='
						flex flex-col
						gap-2
						p-3
						border-b
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
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={actions.createSession}>New Session</ContextMenuItem>
				<ContextMenuItem onClick={actions.createGroup}>New Group</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

export default $app.memo(Index)

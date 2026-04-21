import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '@/__shadcn__/components/ui/context-menu'

import Card from './Card'

import type { IPropsGroups } from '../../../types'
import type { TDragEndEvent } from './types'

const Index = (props: IPropsGroups) => {
	const {
		groups,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_id,
		rename_value,
		setSelectedSession,
		startRenameGroup,
		startRenameSession,
		setRenameValue,
		submitRename,
		cancelRename,
		createSession,
		createGroup,
		removeSession,
		removeGroup,
		togglePinSession,
		sortGroup,
		sortGroupSession,
		moveSessionToGroup,
		moveSessionOutGroup
	} = props

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
									groups={groups}
									group_name={group_item.group}
									items={group_item.items}
									pin_map={pin_map}
									selected_session_id={selected_session_id}
									rename_group_index={rename_group_index}
									rename_session_id={rename_session_id}
									rename_value={rename_value}
									setSelectedSession={setSelectedSession}
									startRenameGroup={startRenameGroup}
									startRenameSession={startRenameSession}
									setRenameValue={setRenameValue}
									submitRename={submitRename}
									cancelRename={cancelRename}
									createSession={createSession}
									createGroup={createGroup}
									removeSession={removeSession}
									removeGroup={removeGroup}
									togglePinSession={togglePinSession}
									sortGroup={sortGroup}
									sortGroupSession={sortGroupSession}
									moveSessionToGroup={moveSessionToGroup}
									moveSessionOutGroup={moveSessionOutGroup}
									key={`${group_item.group}-${group_index}`}
								></Card>
							))}
						</SortableContext>
					</DndContext>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={createSession}>New Session</ContextMenuItem>
				<ContextMenuItem onClick={createGroup}>New Group</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

export default $app.memo(Index)

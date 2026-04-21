import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import RenameInput from '@/pages/session/components/RenameInput'
import { useMenuContext } from '@/pages/session/context'

import CardMenu from './CardMenu'
import Row from './Row'

import type { IPropsGroupCard, IPropsGroupCardMenu, IPropsGroupSessionRow, TDragEndEvent } from './types'

const Index = (props: IPropsGroupCard) => {
	const {
		group_index,
		groups,
		group_name,
		items,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_id,
		rename_value
	} = props
	const actions = useMenuContext()

	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: `group-${group_index}` })
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
	const active_rename = rename_group_index === group_index

	const dragSessionEnd = useMemoizedFn((args: TDragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = items.findIndex(item => item.id === active.id)
		const to = items.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		actions.sortGroupSession({ group_index, from, to })
	})

	const props_card_menu: IPropsGroupCardMenu = {
		group_index,
		groups_count: groups.length,
		group_name
	}

	const props_row: Omit<IPropsGroupSessionRow, 'session_index' | 'item'> = {
		group_index,
		group_items_count: items.length,
		groups: groups.map(group_item => ({
			group: group_item.group,
			items: group_item.items
		})),
		pin_map,
		selected_session_id,
		rename_session_id,
		rename_value
	}

	return (
		<div
			className='
				flex flex-col
				gap-2
				p-2
				rounded-lg
				border border-border-light/60
			'
			style={{ transform: CSS.Translate.toString(transform), transition }}
			ref={setNodeRef}
		>
			<ContextMenu>
				<ContextMenuTrigger>
					<div className='group flex items-center gap-2'>
						<button
							className='
								text-muted-foreground
								opacity-0
								transition-opacity
								group-hover:opacity-100
								cursor-grab
							'
							type='button'
							{...attributes}
							{...listeners}
						>
							⋮⋮
						</button>
						<div className='min-w-0 flex-1'>
							{active_rename ? (
								<RenameInput
									active={active_rename}
									value={rename_value}
									setRenameValue={actions.setRenameValue}
									submitRename={actions.submitRename}
									cancelRename={actions.cancelRename}
								></RenameInput>
							) : (
								<div className='truncate text-sm font-medium'>{group_name}</div>
							)}
						</div>
					</div>
				</ContextMenuTrigger>
				<CardMenu {...props_card_menu}></CardMenu>
			</ContextMenu>

			<DndContext sensors={sensors} onDragEnd={dragSessionEnd}>
				<SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
					<div className='flex flex-col gap-1'>
						{items.map((item, session_index) => (
							<Row
								session_index={session_index}
								item={item}
								{...props_row}
								key={item.id}
							></Row>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}

export default $app.memo(Index)

import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'

import RenameInput from '@/pages/session/components/RenameInput'
import { useModel } from '@/pages/session/context'

import Row from './Row'

import type { IPropsGroupCard, TDragEndEvent } from './types'

const Index = (props: IPropsGroupCard) => {
	const {
		groupIndex,
		groups,
		groupName,
		items,
		pinMap,
		selectedSessionId,
		renameGroupIndex,
		renameSessionIndex,
		renameValue
	} = props
	const { sortGroupSession, setRenameValue, submitRename, cancelRename } = useModel()

	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: `group-${groupIndex}` })
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
	const active_rename = renameGroupIndex === groupIndex && renameSessionIndex < 0

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

		sortGroupSession({ group_index: groupIndex, from, to })
	})

	return (
		<div
			className='flex w-full flex-col'
			style={{ transform: CSS.Translate.toString(transform), transition }}
			ref={setNodeRef}
		>
			<div
				className='
					relative
					flex
					items-center
					mb-1
					group
				'
				data-group-index={groupIndex}
				data-session-index={-1}
				data-id=''
			>
				<div className='flex flex-1 items-center px-2.5'>
					{active_rename ? (
						<RenameInput
							active={active_rename}
							value={renameValue}
							setRenameValue={setRenameValue}
							submitRename={submitRename}
							cancelRename={cancelRename}
						></RenameInput>
					) : (
						<div className='text-std-300 text-xsm truncate font-medium'>{groupName}</div>
					)}
				</div>
				<button
					className='
						absolute
						right-2
						opacity-0
						transition-opacity
						group-hover:opacity-100
						cursor-grab icon_btn
					'
					type='button'
					{...attributes}
					{...listeners}
				>
					<DotsSixVerticalIcon weight='bold'></DotsSixVerticalIcon>
				</button>
			</div>
			<DndContext sensors={sensors} onDragEnd={dragSessionEnd}>
				<SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
					<div className='flex flex-col'>
						{items.map((item, session_index) => (
							<Row
								item={item}
								groups={groups}
								groupItemsCount={items.length}
								pin={item.id in pinMap}
								selected={selectedSessionId === item.id}
								groupIndex={groupIndex}
								sessionIndex={session_index}
								renaming={
									renameGroupIndex === groupIndex &&
									renameSessionIndex === session_index
								}
								renameValue={
									renameGroupIndex === groupIndex &&
									renameSessionIndex === session_index
										? renameValue
										: ''
								}
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

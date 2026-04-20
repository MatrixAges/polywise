import { useEffect, useRef } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'
import { Pin } from 'lucide-react'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger
} from '@/__shadcn__/components/ui/context-menu'
import { Input } from '@/__shadcn__/components/ui/input'

import type { Session } from '@core/db'
import type { DragEndEvent } from '@dnd-kit/core'
import type { IPropsGroups } from '../../../types'

interface IPropsRenameInput {
	active: boolean
	value: string
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
}

interface IPropsSessionRow {
	group_index: number
	session_index: number
	item: Session
	group_items_count: number
	groups: Array<{ group: string; items: Array<Session> }>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameSession: IPropsGroups['startRenameSession']
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	togglePinSession: (id: string) => void
	sortGroupSession: IPropsGroups['sortGroupSession']
	moveSessionToGroup: IPropsGroups['moveSessionToGroup']
	moveSessionOutGroup: IPropsGroups['moveSessionOutGroup']
}

interface IPropsGroupCard {
	group_index: number
	groups: IPropsGroups['groups']
	group_name: string
	items: Array<Session>
	pin_map: Record<string, number>
	selected_session_id: string
	rename_group_index: number
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameGroup: IPropsGroups['startRenameGroup']
	startRenameSession: IPropsGroups['startRenameSession']
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	removeGroup: (group_index: number) => void
	togglePinSession: (id: string) => void
	sortGroup: (from: number, to: number) => void
	sortGroupSession: IPropsGroups['sortGroupSession']
	moveSessionToGroup: IPropsGroups['moveSessionToGroup']
	moveSessionOutGroup: IPropsGroups['moveSessionOutGroup']
}

const RenameInput = (props: IPropsRenameInput) => {
	const { active, value, setRenameValue, submitRename, cancelRename } = props
	const ref_input = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (active) {
			ref_input.current?.focus()
			ref_input.current?.select()
		}
	}, [active])

	if (!active) {
		return null
	}

	return (
		<Input
			className='h-8 rounded-lg px-2'
			value={value}
			onChange={event => setRenameValue(event.target.value)}
			onBlur={submitRename}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					submitRename()
				}

				if (event.key === 'Escape') {
					event.preventDefault()
					cancelRename()
				}
			}}
			ref={ref_input}
		></Input>
	)
}

const SessionRow = (props: IPropsSessionRow) => {
	const {
		group_index,
		session_index,
		item,
		group_items_count,
		groups,
		pin_map,
		selected_session_id,
		rename_session_id,
		rename_value,
		setSelectedSession,
		startRenameSession,
		setRenameValue,
		submitRename,
		cancelRename,
		createSession,
		createGroup,
		removeSession,
		togglePinSession,
		sortGroupSession,
		moveSessionToGroup,
		moveSessionOutGroup
	} = props

	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id })
	const active_rename = rename_session_id === item.id

	const moveUp = useMemoizedFn(() => {
		sortGroupSession({ group_index, from: session_index, to: session_index - 1 })
	})

	const moveDown = useMemoizedFn(() => {
		sortGroupSession({ group_index, from: session_index, to: session_index + 1 })
	})

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={$cx(
						`
						flex
						items-center
						gap-2
						px-3 py-2
						rounded-md
						text-sm
						text-left
						group
					`,
						selected_session_id === item.id && 'bg-muted'
					)}
					style={{ transform: CSS.Translate.toString(transform), transition }}
					onClick={() => setSelectedSession(item.id)}
					ref={setNodeRef}
				>
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
					{pin_map[item.id] && <Pin size={12} className='text-amber-500' />}
					<div className='min-w-0 flex-1'>
						{active_rename ? (
							<RenameInput
								active={active_rename}
								value={rename_value}
								setRenameValue={setRenameValue}
								submitRename={submitRename}
								cancelRename={cancelRename}
							></RenameInput>
						) : (
							<span className='truncate'>{item.title}</span>
						)}
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={createSession}>New Session</ContextMenuItem>
				<ContextMenuItem onClick={createGroup}>New Group</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem onClick={() => startRenameSession({ id: item.id, value: item.title })}>
					Rename
				</ContextMenuItem>
				<ContextMenuItem onClick={() => togglePinSession(item.id)}>
					{pin_map[item.id] ? 'Unpin' : 'Pin'}
				</ContextMenuItem>
				<ContextMenuSub>
					<ContextMenuSubTrigger>Move To Group</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						{groups.map((target_group, index) => {
							if (index === group_index) {
								return null
							}

							return (
								<ContextMenuItem
									onClick={() =>
										moveSessionToGroup({ id: item.id, group_index: index })
									}
									key={`${target_group.group}-${index}`}
								>
									{target_group.group}
								</ContextMenuItem>
							)
						})}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuItem onClick={() => moveSessionOutGroup({ id: item.id, group_index })}>
					Move Out Group
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem disabled={session_index === 0} onClick={moveUp}>
					Move Up
				</ContextMenuItem>
				<ContextMenuItem disabled={session_index >= group_items_count - 1} onClick={moveDown}>
					Move Down
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem variant='destructive' onClick={() => removeSession(item.id)}>
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

const GroupCard = (props: IPropsGroupCard) => {
	const {
		group_index,
		groups,
		group_name,
		items,
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

	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: `group-${group_index}` })
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
	const active_rename = rename_group_index === group_index

	const dragSessionEnd = useMemoizedFn((args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = items.findIndex(item => item.id === active.id)
		const to = items.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		sortGroupSession({ group_index, from, to })
	})

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
									setRenameValue={setRenameValue}
									submitRename={submitRename}
									cancelRename={cancelRename}
								></RenameInput>
							) : (
								<div className='truncate text-sm font-medium'>{group_name}</div>
							)}
						</div>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={createSession}>New Session</ContextMenuItem>
					<ContextMenuItem onClick={createGroup}>New Group</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem onClick={() => startRenameGroup({ group_index, value: group_name })}>
						Rename Group
					</ContextMenuItem>
					<ContextMenuItem
						disabled={group_index === 0}
						onClick={() => sortGroup(group_index, group_index - 1)}
					>
						Move Up
					</ContextMenuItem>
					<ContextMenuItem
						disabled={group_index >= groups.length - 1}
						onClick={() => sortGroup(group_index, group_index + 1)}
					>
						Move Down
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem variant='destructive' onClick={() => removeGroup(group_index)}>
						Delete Group
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			<DndContext sensors={sensors} onDragEnd={dragSessionEnd}>
				<SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
					<div className='flex flex-col gap-1'>
						{items.map((item, session_index) => (
							<SessionRow
								group_index={group_index}
								session_index={session_index}
								item={item}
								group_items_count={items.length}
								groups={groups.map(group_item => ({
									group: group_item.group,
									items: group_item.items
								}))}
								pin_map={pin_map}
								selected_session_id={selected_session_id}
								rename_session_id={rename_session_id}
								rename_value={rename_value}
								setSelectedSession={setSelectedSession}
								startRenameSession={startRenameSession}
								setRenameValue={setRenameValue}
								submitRename={submitRename}
								cancelRename={cancelRename}
								createSession={createSession}
								createGroup={createGroup}
								removeSession={removeSession}
								togglePinSession={togglePinSession}
								sortGroupSession={sortGroupSession}
								moveSessionToGroup={moveSessionToGroup}
								moveSessionOutGroup={moveSessionOutGroup}
								key={item.id}
							></SessionRow>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}

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

	const dragGroupEnd = useMemoizedFn((args: DragEndEvent) => {
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
								<GroupCard
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
								></GroupCard>
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

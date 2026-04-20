import { useEffect, useRef } from 'react'
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
import type { IPropsSessions } from '../../../types'

interface IPropsRenameInput {
	active: boolean
	value: string
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
}

interface IPropsSessionItem {
	item: Session
	groups: IPropsSessions['groups']
	pin_map: Record<string, number>
	selected_session_id: string
	rename_session_id: string
	rename_value: string
	setSelectedSession: (id: string) => void
	startRenameSession: IPropsSessions['startRenameSession']
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
	createSession: () => void
	createGroup: () => void
	removeSession: (id: string) => void
	togglePinSession: (id: string) => void
	moveSessionToGroup: IPropsSessions['moveSessionToGroup']
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

const SessionItem = (props: IPropsSessionItem) => {
	const {
		item,
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
		moveSessionToGroup
	} = props

	const active_rename = rename_session_id === item.id

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
					`,
						selected_session_id === item.id && 'bg-muted'
					)}
					onClick={() => setSelectedSession(item.id)}
				>
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
						{groups.map((group_item, group_index) => (
							<ContextMenuItem
								onClick={() => moveSessionToGroup({ id: item.id, group_index })}
								key={`${group_item.group}-${group_index}`}
							>
								{group_item.group}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSeparator />
				<ContextMenuItem variant='destructive' onClick={() => removeSession(item.id)}>
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

const Index = (props: IPropsSessions) => {
	const {
		groups,
		sessions,
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
		moveSessionToGroup,
		onScroll
	} = props

	const handleSelectSession = useMemoizedFn((id: string) => setSelectedSession(id))

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div className='flex-1 overflow-y-auto p-3' onScroll={onScroll}>
					<div className='flex flex-col gap-1'>
						{sessions.map(item => (
							<SessionItem
								item={item}
								groups={groups}
								pin_map={pin_map}
								selected_session_id={selected_session_id}
								rename_session_id={rename_session_id}
								rename_value={rename_value}
								setSelectedSession={handleSelectSession}
								startRenameSession={startRenameSession}
								setRenameValue={setRenameValue}
								submitRename={submitRename}
								cancelRename={cancelRename}
								createSession={createSession}
								createGroup={createGroup}
								removeSession={removeSession}
								togglePinSession={togglePinSession}
								moveSessionToGroup={moveSessionToGroup}
								key={item.id}
							></SessionItem>
						))}
					</div>
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

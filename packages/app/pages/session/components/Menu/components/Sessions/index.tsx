import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '@/__shadcn__/components/ui/context-menu'

import Item from './Item'

import type { IPropsSessions } from '../../../../types'
import type { IPropsSessionItem } from './types'

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

	const props_item: Omit<IPropsSessionItem, 'item'> = {
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
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div className='flex-1 overflow-y-auto p-3' onScroll={onScroll}>
					<div className='flex flex-col gap-1'>
						{sessions.map(item => (
							<Item item={item} {...props_item} key={item.id}></Item>
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

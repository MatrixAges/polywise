import {
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger
} from '@/__shadcn__/components/ui/context-menu'
import { useMenuContext } from '@/pages/session/context'

import type { IPropsSessionItemMenu } from './types'

const Index = (props: IPropsSessionItemMenu) => {
	const { item, groups, pin, session_index } = props
	const { createSession, createGroup, startRenameSession, togglePinSession, moveSessionToGroup, removeSession } =
		useMenuContext()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={createSession}>New Session</ContextMenuItem>
			<ContextMenuItem onClick={createGroup}>New Group</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem
				onClick={() =>
					startRenameSession({
						rename_group_index: undefined,
						rename_session_index: session_index,
						value: item.title
					})
				}
			>
				Rename
			</ContextMenuItem>
			<ContextMenuItem onClick={() => togglePinSession(item.id)}>{pin ? 'Unpin' : 'Pin'}</ContextMenuItem>
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
	)
}

export default $app.memo(Index)

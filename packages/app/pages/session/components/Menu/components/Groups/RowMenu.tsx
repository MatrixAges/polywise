import { useMemoizedFn } from 'ahooks'

import {
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger
} from '@/__shadcn__/components/ui/context-menu'

import type { IPropsGroupSessionRowMenu } from './types'

const Index = (props: IPropsGroupSessionRowMenu) => {
	const {
		group_index,
		session_index,
		group_items_count,
		item,
		groups,
		pin_map,
		startRenameSession,
		createSession,
		createGroup,
		removeSession,
		togglePinSession,
		sortGroupSession,
		moveSessionToGroup,
		moveSessionOutGroup
	} = props

	const moveUp = useMemoizedFn(() => {
		sortGroupSession({ group_index, from: session_index, to: session_index - 1 })
	})

	const moveDown = useMemoizedFn(() => {
		sortGroupSession({ group_index, from: session_index, to: session_index + 1 })
	})

	return (
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
								onClick={() => moveSessionToGroup({ id: item.id, group_index: index })}
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
	)
}

export default $app.memo(Index)

import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'

import type { IPropsGroupCardMenu } from './types'

const Index = (props: IPropsGroupCardMenu) => {
	const {
		group_index,
		groups_count,
		group_name,
		startRenameGroup,
		createSession,
		createGroup,
		removeGroup,
		sortGroup
	} = props

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={createSession}>New Session</ContextMenuItem>
			<ContextMenuItem onClick={createGroup}>New Group</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => startRenameGroup({ group_index, value: group_name })}>
				Rename Group
			</ContextMenuItem>
			<ContextMenuItem disabled={group_index === 0} onClick={() => sortGroup(group_index, group_index - 1)}>
				Move Up
			</ContextMenuItem>
			<ContextMenuItem
				disabled={group_index >= groups_count - 1}
				onClick={() => sortGroup(group_index, group_index + 1)}
			>
				Move Down
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeGroup(group_index)}>
				Delete Group
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

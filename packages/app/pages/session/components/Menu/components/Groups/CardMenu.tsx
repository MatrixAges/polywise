import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { IPropsGroupCardMenu } from './types'

const Index = (props: IPropsGroupCardMenu) => {
	const { groupIndex, groupsCount, groupName } = props
	const { createSession, createGroup, startRenameGroup, sortGroup, removeGroup } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={createSession}>New Session</ContextMenuItem>
			<ContextMenuItem onClick={createGroup}>New Group</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => startRenameGroup({ group_index: groupIndex, value: groupName })}>
				Rename Group
			</ContextMenuItem>
			<ContextMenuItem disabled={groupIndex === 0} onClick={() => sortGroup(groupIndex, groupIndex - 1)}>
				Move Up
			</ContextMenuItem>
			<ContextMenuItem
				disabled={groupIndex >= groupsCount - 1}
				onClick={() => sortGroup(groupIndex, groupIndex + 1)}
			>
				Move Down
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeGroup(groupIndex)}>
				Delete Group
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

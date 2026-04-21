import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useMenuContext } from '@/pages/session/context'

import type { IPropsGroupCardMenu } from './types'

const Index = (props: IPropsGroupCardMenu) => {
	const { group_index, groups_count, group_name } = props
	const actions = useMenuContext()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={actions.createSession}>New Session</ContextMenuItem>
			<ContextMenuItem onClick={actions.createGroup}>New Group</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => actions.startRenameGroup({ group_index, value: group_name })}>
				Rename Group
			</ContextMenuItem>
			<ContextMenuItem
				disabled={group_index === 0}
				onClick={() => actions.sortGroup(group_index, group_index - 1)}
			>
				Move Up
			</ContextMenuItem>
			<ContextMenuItem
				disabled={group_index >= groups_count - 1}
				onClick={() => actions.sortGroup(group_index, group_index + 1)}
			>
				Move Down
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => actions.removeGroup(group_index)}>
				Delete Group
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

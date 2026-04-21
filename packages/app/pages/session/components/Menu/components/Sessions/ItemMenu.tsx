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
	const { item, groups, pin } = props
	const actions = useMenuContext()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={actions.createSession}>New Session</ContextMenuItem>
			<ContextMenuItem onClick={actions.createGroup}>New Group</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => actions.startRenameSession({ id: item.id, value: item.title })}>
				Rename
			</ContextMenuItem>
			<ContextMenuItem onClick={() => actions.togglePinSession(item.id)}>
				{pin ? 'Unpin' : 'Pin'}
			</ContextMenuItem>
			<ContextMenuSub>
				<ContextMenuSubTrigger>Move To Group</ContextMenuSubTrigger>
				<ContextMenuSubContent>
					{groups.map((group_item, group_index) => (
						<ContextMenuItem
							onClick={() => actions.moveSessionToGroup({ id: item.id, group_index })}
							key={`${group_item.group}-${group_index}`}
						>
							{group_item.group}
						</ContextMenuItem>
					))}
				</ContextMenuSubContent>
			</ContextMenuSub>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => actions.removeSession(item.id)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

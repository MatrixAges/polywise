import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'

import type { AgentSessionItem } from '../types'

interface IProps {
	item: AgentSessionItem
	pin: boolean
}

const Index = (props: IProps) => {
	const { item, pin } = props
	const { createSession, onRenameSession, togglePinSession, removeSession } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => createSession()}>New Session</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => onRenameSession(item.id, item.title)}>Rename</ContextMenuItem>
			<ContextMenuItem onClick={() => togglePinSession(item.id)}>{pin ? 'Unpin' : 'Pin'}</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeSession(item.id)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

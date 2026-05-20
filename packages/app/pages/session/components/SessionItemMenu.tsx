import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'

import type { Session } from '@core/db'

interface IProps {
	item: Session
	pin: boolean
}

const Index = (props: IProps) => {
	const { item, pin } = props
	const { createSession, menu_tab, onRenameSession, togglePinSession, removeSession } = useModel()

	return (
		<ContextMenuContent>
			{menu_tab !== 'im' ? (
				<>
					<ContextMenuItem onClick={() => createSession()}>New Session</ContextMenuItem>
					<ContextMenuSeparator />
				</>
			) : null}
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

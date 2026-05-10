import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { Session } from '@core/db'

interface IProps {
	sessionItem: Session
}

const Index = (props: IProps) => {
	const { sessionItem } = props
	const { onRenameSession, removeSession } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => onRenameSession(sessionItem.id, sessionItem.title)}>
				Rename
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeSession(sessionItem.id)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

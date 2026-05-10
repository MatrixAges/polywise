import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { Session } from '@core/db'

interface IProps {
	session_item: Session
}

const Index = (props: IProps) => {
	const { session_item } = props
	const { onRenameSession, removeSession } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => onRenameSession(session_item.id, session_item.title)}>
				Rename
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeSession(session_item.id)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

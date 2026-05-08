import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/project/context'

import type { Session } from '@core/db'

interface IProps {
	projectId: string
	sessionItem: Session
}

const Index = (props: IProps) => {
	const { projectId, sessionItem } = props
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

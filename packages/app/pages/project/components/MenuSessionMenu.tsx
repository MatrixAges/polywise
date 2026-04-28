import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/project/context'

import type { Session } from '@core/db'

interface IProps {
	project_id: string
	session_item: Session
}

const Index = (props: IProps) => {
	const { project_id, session_item } = props
	const { renameSession, removeSession } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem
				onClick={() =>
					renameSession({ project_id, session_id: session_item.id, title: session_item.title })
				}
			>
				Rename
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem
				variant='destructive'
				onClick={() => removeSession({ project_id, session_id: session_item.id })}
			>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

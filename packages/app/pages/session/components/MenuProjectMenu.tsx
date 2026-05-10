import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { Project } from '@core/db'

interface IProps {
	project_item: Project
}

const Index = (props: IProps) => {
	const { project_item } = props
	const { createSession, onRenameProject, removeProject } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => createSession(project_item.id)}>New Session</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => onRenameProject(project_item.id, project_item.name)}>
				Rename
			</ContextMenuItem>
			<ContextMenuItem variant='destructive' onClick={() => removeProject(project_item)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

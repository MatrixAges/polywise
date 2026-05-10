import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { Project } from '@core/db'

interface IProps {
	projectItem: Project
}

const Index = (props: IProps) => {
	const { projectItem } = props
	const { createSession, onRenameProject, removeProject } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => createSession(projectItem.id)}>New Session</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => onRenameProject(projectItem.id, projectItem.name)}>
				Rename
			</ContextMenuItem>
			<ContextMenuItem variant='destructive' onClick={() => removeProject(projectItem)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/project/context'

import type { Project } from '@core/db'

interface IProps {
	project_item: Project
}

const Index = (props: IProps) => {
	const { project_item } = props
	const { createSession, renameProject, removeProject } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => createSession({ project_id: project_item.id })}>
				New Session
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => renameProject(project_item)}>Rename</ContextMenuItem>
			<ContextMenuItem variant='destructive' onClick={() => removeProject(project_item)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

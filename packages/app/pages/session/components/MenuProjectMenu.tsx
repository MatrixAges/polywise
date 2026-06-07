import { useTranslation } from 'react-i18next'

import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { Project } from '@core/db'

interface IProps {
	project_item: Project
}

const Index = (props: IProps) => {
	const { project_item } = props
	const { createSession, onRenameProject, removeProject } = useModel()
	const { t } = useTranslation('session')

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => createSession(project_item.id)}>
				{t('project.new_session')}
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => onRenameProject(project_item.id, project_item.name)}>
				{t('project.rename')}
			</ContextMenuItem>
			<ContextMenuItem variant='destructive' onClick={() => removeProject(project_item)}>
				{t('project.delete')}
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

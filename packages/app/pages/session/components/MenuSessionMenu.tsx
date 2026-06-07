import { useTranslation } from 'react-i18next'

import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { Session } from '@core/db'

interface IProps {
	session_item: Session
}

const Index = (props: IProps) => {
	const { session_item } = props
	const { onRenameSession, removeSession } = useModel()
	const { t } = useTranslation('session')

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => onRenameSession(session_item.id, session_item.title)}>
				{t('project.rename')}
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeSession(session_item.id)}>
				{t('project.delete')}
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

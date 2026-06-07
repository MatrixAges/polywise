import { useTranslation } from 'react-i18next'

import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'

import type { AgentSessionItem } from '../types'

interface IProps {
	item: AgentSessionItem
	pin: boolean
}

const Index = (props: IProps) => {
	const { item, pin } = props
	const { createSession, onRenameSession, togglePinSession, removeSession } = useModel()
	const { t } = useTranslation('session')

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={() => createSession()}>{t('project.new_session')}</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={() => onRenameSession(item.id, item.title)}>
				{t('project.rename')}
			</ContextMenuItem>
			<ContextMenuItem onClick={() => togglePinSession(item.id)}>
				{pin ? t('menu.unpin') : t('menu.pin')}
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeSession(item.id)}>
				{t('project.delete')}
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

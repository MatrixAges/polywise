import { useTranslation } from 'react-i18next'

import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'

import type { Session } from '@core/db'

interface IProps {
	item: Session
	pin: boolean
}

const Index = (props: IProps) => {
	const { item, pin } = props
	const { createSession, menu_tab, onRenameSession, togglePinSession, removeSession } = useModel()
	const { t } = useTranslation('session')

	return (
		<ContextMenuContent>
			{menu_tab !== 'im' ? (
				<>
					<ContextMenuItem onClick={() => createSession()}>
						{t('project.new_session')}
					</ContextMenuItem>
					<ContextMenuSeparator />
				</>
			) : null}
			<ContextMenuItem onClick={() => onRenameSession(item.id, item.title)}>
				{t('project.rename')}
			</ContextMenuItem>
			<ContextMenuItem onClick={() => togglePinSession(item.id)}>
				{pin ? t('menu.unpin', { defaultValue: 'Unpin' }) : t('menu.pin', { defaultValue: 'Pin' })}
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeSession(item.id)}>
				{t('project.delete')}
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)

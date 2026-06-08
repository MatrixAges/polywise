import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import {
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator
} from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')
	const menu_target = x.menu_target_item
	const menu_action_count = x.menu_action_ids.length

	if (!menu_target || menu_action_count === 0) {
		return null
	}

	return (
		<ContextMenuContent>
			{menu_action_count > 1 && (
				<>
					<ContextMenuLabel>
						{t('selection.selected', { count: menu_action_count })}
					</ContextMenuLabel>
					<ContextMenuSeparator></ContextMenuSeparator>
				</>
			)}
			<ContextMenuItem onClick={() => void x.fetchMenuLinks()}>
				{menu_action_count > 1
					? `${t('control.fetch')} ${t('selection.selected', { count: menu_action_count })}`
					: menu_target.article
						? t('control.refetch')
						: t('control.fetch')}
			</ContextMenuItem>
			<ContextMenuItem variant='destructive' onClick={() => void x.removeMenuLinks()}>
				{menu_action_count > 1
					? `${t('selection.delete')} ${t('selection.selected', { count: menu_action_count })}`
					: t('selection.delete')}
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

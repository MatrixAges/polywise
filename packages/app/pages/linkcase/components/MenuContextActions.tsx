import { observer } from 'mobx-react-lite'

import {
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator
} from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const menu_target = x.menu_target_item
	const menu_action_count = x.menu_action_ids.length

	if (!menu_target || menu_action_count === 0) {
		return null
	}

	return (
		<ContextMenuContent>
			{menu_action_count > 1 && (
				<>
					<ContextMenuLabel>{menu_action_count} links selected</ContextMenuLabel>
					<ContextMenuSeparator></ContextMenuSeparator>
				</>
			)}
			<ContextMenuItem onClick={() => void x.fetchMenuLinks()}>
				{menu_action_count > 1
					? `Fetch selected (${menu_action_count})`
					: menu_target.article
						? 'Refetch'
						: 'Fetch'}
			</ContextMenuItem>
			<ContextMenuItem variant='destructive' onClick={() => void x.removeMenuLinks()}>
				{menu_action_count > 1 ? `Remove selected (${menu_action_count})` : 'Remove'}
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

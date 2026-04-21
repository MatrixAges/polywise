import { Pin } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import RenameInput from '@/pages/session/components/RenameInput'
import { useMenuContext } from '@/pages/session/context'

import ItemMenu from './ItemMenu'

import type { IPropsSessionItem } from './types'

const Index = (props: IPropsSessionItem) => {
	const { item, groups, pin_map, selected_session_id, rename_session_id, rename_value } = props
	const actions = useMenuContext()

	const active_rename = rename_session_id === item.id

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={$cx(
						`
						flex
						items-center
						gap-2
						px-3 py-2
						rounded-md
						text-sm
						text-left
					`,
						selected_session_id === item.id && 'bg-muted'
					)}
					onClick={() => actions.setSelectedSession(item.id)}
				>
					{pin_map[item.id] && <Pin size={12} className='text-amber-500' />}
					<div className='min-w-0 flex-1'>
						{active_rename ? (
							<RenameInput
								active={active_rename}
								value={rename_value}
								setRenameValue={actions.setRenameValue}
								submitRename={actions.submitRename}
								cancelRename={actions.cancelRename}
							></RenameInput>
						) : (
							<span className='truncate'>{item.title}</span>
						)}
					</div>
				</div>
			</ContextMenuTrigger>
			<ItemMenu item={item} groups={groups} pin_map={pin_map}></ItemMenu>
		</ContextMenu>
	)
}

export default $app.memo(Index)

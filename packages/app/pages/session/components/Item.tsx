import { Pin } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { Grip } from '@/components/animate'

import { useMenuContext } from '../context'
import RenameInput from './RenameInput'

import type { Session } from '@core/db'
import type { CSSProperties, ReactNode } from 'react'

interface IProps {
	item: Session
	pin_map: Record<string, number>
	selected: boolean
	renaming: boolean
	rename_value: string
	title: ReactNode
	menu: ReactNode
	className?: string
	style?: CSSProperties
}

const Index = (props: IProps) => {
	const { item, pin_map, selected, renaming, rename_value, title, menu, className, style } = props
	const actions = useMenuContext()

	console.log(item)

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={$cx('click_button group', className, selected && 'active')}
					style={style}
					onClick={() => actions.setSelectedSession(item.id)}
				>
					<div className='min-w-0 flex-1'>
						{renaming ? (
							<RenameInput
								active={renaming}
								value={rename_value}
								setRenameValue={actions.setRenameValue}
								submitRename={actions.submitRename}
								cancelRename={actions.cancelRename}
							></RenameInput>
						) : (
							title
						)}
					</div>
					{!item.is_runing ? (
						<Grip className='text-std-300! size-3'></Grip>
					) : pin_map[item.id] ? (
						<Pin className='text-std-300! size-3' />
					) : (
						''
					)}
				</div>
			</ContextMenuTrigger>
			{menu}
		</ContextMenu>
	)
}

export default $app.memo(Index)

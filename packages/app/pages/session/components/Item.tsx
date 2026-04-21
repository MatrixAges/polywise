import { useMemo } from 'react'
import { Pin } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { ArrowLeft, Grip } from '@/components/animate'

import { useMenuContext } from '../context'
import RenameInput from './RenameInput'

import type { Session } from '@core/db'
import type { CSSProperties, ReactNode } from 'react'

interface IProps {
	item: Session
	pin: boolean
	selected: boolean
	renaming: boolean
	rename_value: string
	title: ReactNode
	menu: ReactNode
	className?: string
	style?: CSSProperties
}

const Index = (props: IProps) => {
	const { item, pin, selected, renaming, rename_value, title, menu, className, style } = props
	const { is_runing, unread } = item
	const actions = useMenuContext()

	const Status = useMemo(() => {
		if (item.is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='text-std-300! size-3' />
		if (pin) return <Pin className='text-std-300! size-3' />

		return null
	}, [pin, is_runing, unread])

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
					{Status}
				</div>
			</ContextMenuTrigger>
			{menu}
		</ContextMenu>
	)
}

export default $app.memo(Index)

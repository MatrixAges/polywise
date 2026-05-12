import { Pencil, Trash2 } from 'lucide-react'

import { alert } from '@/utils'

import GroupAvatar from './GroupAvatar'

import type { MouseEvent } from 'react'
import type { GroupItem } from '../types'

interface IProps {
	item: GroupItem
	selected: boolean
	onClick: () => void
	onEdit: () => void
	onRemove: () => Promise<void>
}

const Index = ({ item, selected, onClick, onEdit, onRemove }: IProps) => {
	const handleRemove = async (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		const res = await alert({
			title: 'Remove Group',
			desc: 'Confirm remove this group and all linked group sessions?'
		})

		if (!res) {
			return
		}

		await onRemove()
	}

	return (
		<div
			className={$cx(
				`
				relative
				flex
				gap-2
				px-3 py-2.5
				rounded-sm
				group
				cursor-pointer
			`,
				selected && 'bg-active'
			)}
			onClick={onClick}
		>
			<GroupAvatar item={item} size='small'></GroupAvatar>
			<div className='min-w-0 flex-1'>
				<div className='truncate text-sm font-medium'>{item.name}</div>
				<div className='text-std-400 truncate text-xs'>
					{item.description || `${item.agents.length} agents`}
				</div>
			</div>
			<div
				className='
					absolute
					top-0.5 right-0.5
					opacity-0
					transition-opacity
					group-hover:opacity-100
				'
			>
				<button className='icon_button small' type='button' onClick={event => void handleRemove(event)}>
					<Trash2 className='size-3'></Trash2>
				</button>
				<button
					className='icon_button small'
					type='button'
					onClick={event => {
						event.stopPropagation()
						onEdit()
					}}
				>
					<Pencil className='size-3'></Pencil>
				</button>
			</div>
		</div>
	)
}

export default $app.memo(Index)

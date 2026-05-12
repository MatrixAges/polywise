import { Pencil } from 'lucide-react'

import type { GroupItem } from '../types'

interface IProps {
	item: GroupItem
	selected: boolean
	onClick: () => void
	onEdit: () => void
}

const Index = ({ item, selected, onClick, onEdit }: IProps) => {
	const initials = item.name
		.split(/\s+/)
		.map(part => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()

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
			<div
				className='
					flex shrink-0
					items-center justify-center
					size-9
					rounded-full
					text-xs text-std-600 font-semibold
					bg-std-100
				'
			>
				{initials || 'G'}
			</div>
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

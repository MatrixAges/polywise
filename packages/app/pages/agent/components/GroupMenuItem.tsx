import { useMemo } from 'react'
import { Bubbles, Pencil } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { ArrowLeft, Grip } from '@/components/animate'

import { useModel } from '../context'
import GroupAvatar from './GroupAvatar'

import type { GroupItem } from '../types'

interface IProps {
	item: GroupItem
	selected: boolean
	onClick: () => void
	onEdit: () => void
}

const Index = ({ item, selected, onClick, onEdit }: IProps) => {
	const { session_status_map } = useModel()
	const live_status = item.session?.id ? session_status_map[item.session.id] : null
	const is_runing = live_status?.running ?? item.session?.is_runing
	const unread = live_status?.unread ?? item.session?.unread
	const preview_text = item.last_message?.text
		? `${item.last_message.sender ? `${item.last_message.sender}：` : ''}${item.last_message.text}`
		: item.description || `${item.agents.length} agents`
	const Status = useMemo(() => {
		if (is_runing) return <Grip className='text-std-400! size-2.5' />
		if (unread) return <ArrowLeft className='size-2.5 text-indigo-500!' />

		return <Bubbles className='text-std-400 size-2.5' />
	}, [is_runing, unread])

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
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					gap-0.5
				'
			>
				<div className='flex items-center gap-1.5'>
					<div
						className='
							flex-1
							min-w-0
							text-sm font-medium
							truncate
						'
					>
						{item.name}
					</div>
					<div className='flex shrink-0'>{Status}</div>
				</div>
				<div className='text-std-400 truncate text-xs'>{preview_text}</div>
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

export default new $app.Handle(Index).by(observer).by($app.memo).get()

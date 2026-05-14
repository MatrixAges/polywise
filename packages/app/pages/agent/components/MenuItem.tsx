import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'
import { Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { alert } from '@/utils'

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'

import type { MouseEvent } from 'react'
import type { AgentItem } from '../types'

interface IProps {
	item: AgentItem
	selected: boolean
}

const Index = (props: IProps) => {
	const { item, selected } = props
	const { openAgentDetail, openAgentSessions, removeAgent } = useModel()
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({ id: item.id })
	const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()
	const onRemove = async (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		const res = await alert({
			title: 'Remove Agent',
			desc: 'Confirm remove this agent?'
		})

		if (!res) return

		await removeAgent(item.id)
	}

	return (
		<div
			className={$cx(
				`
				relative
				flex
				gap-2
				p-2.5
				rounded-sm
				group
				cursor-pointer
			`,
				selected && 'bg-active',
				isDragging && 'dragging z-10 backdrop-blur-lg'
			)}
			onClick={() => openAgentSessions(item.id)}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
		>
			<AgentAvatar item={item} size='small'></AgentAvatar>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					gap-0.5
				'
			>
				<div className='truncate text-sm font-medium'>{item.name}</div>
				<div className='text-std-400 truncate text-xs'>{item.role || 'No Role'}</div>
			</div>
			<div
				className='
					absolute
					top-0.5 right-0.5
					flex
					items-center
					opacity-0
					transition-opacity
					group-hover:opacity-100
				'
			>
				<button className='icon_button small' type='button' onClick={event => void onRemove(event)}>
					<Trash2 className='size-3'></Trash2>
				</button>
				<button
					className='icon_button small cursor-grab'
					type='button'
					onClick={stopPropagation}
					{...attributes}
					{...listeners}
				>
					<DotsSixVerticalIcon className='size-3.5' weight='bold'></DotsSixVerticalIcon>
				</button>
				<button
					className='icon_button small'
					type='button'
					onClick={(event: MouseEvent<HTMLButtonElement>) => {
						event.stopPropagation()
						openAgentDetail(item.id)
					}}
				>
					<Pencil className='size-3'></Pencil>
				</button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'
import { Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

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

	return (
		<div
			className={$cx(
				`
				flex flex-col
				gap-1
				p-2.5
				rounded-xl
				group
				clickable
			`,
				selected && 'bg-active',
				isDragging && 'dragging z-10 backdrop-blur-lg'
			)}
			onClick={() => openAgentSessions(item.id)}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
		>
			<div className='flex items-start gap-2.5'>
				<AgentAvatar item={item} size='small'></AgentAvatar>
				<div className='min-w-0 flex-1'>
					<div className='truncate text-sm font-medium'>{item.name}</div>
					<div className='text-std-400 line-clamp-2 text-xs'>
						{item.description || 'No description'}
					</div>
				</div>
				<div
					className='
						flex
						items-center
						opacity-0
						transition-opacity
						group-hover:opacity-100
						-mr-1
					'
				>
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
					<button
						className='icon_button small'
						type='button'
						onClick={(event: MouseEvent<HTMLButtonElement>) => {
							event.stopPropagation()
							removeAgent(item.id)
						}}
					>
						<Trash2 className='size-3.5'></Trash2>
					</button>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'
import { Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

import type { SkillItem } from '../types'

interface IProps {
	item: SkillItem
	selected: boolean
}

const Index = (props: IProps) => {
	const { item, selected } = props
	const { setSelectedSkill, removeSkill } = useModel()
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item.id
	})

	return (
		<div
			className={$cx(
				`
				flex
				items-center
				gap-2
				px-2 py-2
				rounded-lg
				group
				clickable
			`,
				selected && 'bg-active',
				isDragging && 'dragging z-10 backdrop-blur-lg'
			)}
			onClick={() => void setSelectedSkill(item.id)}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
		>
			<button className='icon_button small cursor-grab' type='button' {...attributes} {...listeners}>
				<DotsSixVerticalIcon className='size-3.5' weight='bold'></DotsSixVerticalIcon>
			</button>
			<div className='min-w-0 flex-1'>
				<div className='truncate text-sm font-medium'>{item.name}</div>
				<div className='text-std-400 truncate text-xs'>{item.desc || 'No description'}</div>
			</div>
			<button
				className='icon_button small opacity-0 group-hover:opacity-100'
				type='button'
				onClick={event => {
					event.stopPropagation()
					void removeSkill(item.id)
				}}
			>
				<Trash2 className='size-3.5'></Trash2>
			</button>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

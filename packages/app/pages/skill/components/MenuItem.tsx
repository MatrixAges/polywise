import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'
import { Pencil } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

import type { SkillItem } from '../types'

interface IProps {
	item: SkillItem
	selected: boolean
}

const Index = (props: IProps) => {
	const { item, selected } = props
	const { setSelectedSkill, openEditDialog } = useModel()
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item.id
	})

	return (
		<div
			className={$cx(
				`
				flex flex-col
				gap-0.5
				p-3 pt-2
				pb-2.5
				rounded-sm
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
			<div
				className='
					flex
					items-center justify-between
					gap-1
				'
			>
				<div className='truncate text-sm font-medium'>{item.name}</div>
				<div className='flex items-center opacity-0 group-hover:opacity-100'>
					<button
						className='icon_button small cursor-grab'
						type='button'
						{...attributes}
						{...listeners}
					>
						<DotsSixVerticalIcon className='size-3.5' weight='bold'></DotsSixVerticalIcon>
					</button>
					<button
						className='icon_button small'
						type='button'
						onClick={() => {
							openEditDialog(item.id)
						}}
					>
						<Pencil className='size-3'></Pencil>
					</button>
				</div>
			</div>
			<div className='text-std-400 line-clamp-3 text-xs'>{item.desc || 'No description'}</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

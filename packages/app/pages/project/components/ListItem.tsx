import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, PencilLine, Trash2 } from 'lucide-react'

import { useProjectContext } from '../context'

import type { MouseEvent } from 'react'
import type { IPropsListItem } from './types'

const Index = (props: IPropsListItem) => {
	const { project_item, project_index, selected } = props
	const { setSelectedProject, openRenameProjectDialog, openDeleteProjectDialog } = useProjectContext()
	const { attributes, listeners, transform, transition, setNodeRef, isDragging } = useSortable({
		id: project_item.id
	})

	return (
		<div
			className={$cx(
				`
				flex
				items-center
				gap-2
				px-2 py-1
				rounded
				text-sm
				border border-border-light
			`,
				selected && 'active',
				isDragging && 'opacity-60'
			)}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			data-project-index={project_index}
			onClick={() => setSelectedProject(project_item.id)}
		>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					text-left
				'
			>
				<div className='truncate font-medium'>{project_item.name}</div>
				<div className='text-std-400 truncate text-xs'>{project_item.dir}</div>
			</div>
			<button
				type='button'
				className='icon_button small'
				{...attributes}
				{...listeners}
				onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
			>
				<GripVertical></GripVertical>
			</button>
			<button
				type='button'
				className='icon_button small'
				onClick={(event: MouseEvent<HTMLButtonElement>) => {
					event.stopPropagation()
					openRenameProjectDialog(project_item)
				}}
			>
				<PencilLine></PencilLine>
			</button>
			<button
				type='button'
				className='icon_button small'
				onClick={(event: MouseEvent<HTMLButtonElement>) => {
					event.stopPropagation()
					openDeleteProjectDialog(project_item)
				}}
			>
				<Trash2></Trash2>
			</button>
		</div>
	)
}

export default $app.memo(Index)

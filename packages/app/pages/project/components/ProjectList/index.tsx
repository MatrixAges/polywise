import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'
import { Plus } from 'lucide-react'

import { Tooltip } from '@/components'

import Item from './Item'

import type { DragEndEvent } from '@dnd-kit/core'
import type { IProjectSerializedProjectItem } from '../../types'

interface IProps {
	projects: Array<IProjectSerializedProjectItem>
	selected_project_id: string
	createProject: (args: { name: string; dir: string }) => Promise<void>
	renameProject: (args: { id: string; name: string }) => Promise<void>
	removeProject: (id: string) => Promise<void>
	sortProject: (args: { from: number; to: number }) => Promise<void>
	setSelectedProject: (id: string) => void
}

const Index = (props: IProps) => {
	const {
		projects,
		selected_project_id,
		createProject,
		renameProject,
		removeProject,
		sortProject,
		setSelectedProject
	} = props
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const onCreateProject = useMemoizedFn(async () => {
		const name = window.prompt('Project name')?.trim() || ''

		if (!name) return

		const dir = window.prompt('Project directory')?.trim() || ''

		if (!dir) return

		await createProject({ name, dir })
	})

	const onDragEnd = useMemoizedFn(async (args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = projects.findIndex(item => item.id === active.id)
		const to = projects.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		await sortProject({ from, to })
	})

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center justify-between'>
				<div className='text-std-400 text-xs font-medium'>Projects</div>
				<Tooltip title='New Project'>
					<button type='button' className='icon_button small' onClick={onCreateProject}>
						<Plus></Plus>
					</button>
				</Tooltip>
			</div>
			<DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
				<SortableContext items={projects.map(item => item.id)} strategy={verticalListSortingStrategy}>
					<div className='flex flex-col gap-1'>
						{projects.map((project_item, project_index) => (
							<Item
								key={project_item.id}
								project_item={project_item}
								project_index={project_index}
								selected={selected_project_id === project_item.id}
								renameProject={renameProject}
								removeProject={removeProject}
								setSelectedProject={setSelectedProject}
							></Item>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}

export default $app.memo(Index)

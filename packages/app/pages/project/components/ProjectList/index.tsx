import { useState } from 'react'
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'
import { Plus } from 'lucide-react'

import { Alert, Tooltip } from '@/components'

import Item from './Item'
import ProjectFormDialog from './ProjectFormDialog'

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

const getProjectNameFromDir = (dir: string) => {
	const dir_text = dir.trim()
	const segments = dir_text.split(/[\\/]/).filter(Boolean)

	return segments[segments.length - 1] || dir_text || 'Project'
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
	const [create_open, setCreateOpen] = useState(false)
	const [rename_open, setRenameOpen] = useState(false)
	const [delete_open, setDeleteOpen] = useState(false)
	const [project_name, setProjectName] = useState('')
	const [project_dir, setProjectDir] = useState('')
	const [target_project, setTargetProject] = useState<IProjectSerializedProjectItem | null>(null)
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const onCreateProject = useMemoizedFn(async () => {
		setTargetProject(null)
		setProjectName('')
		setProjectDir('')
		setCreateOpen(true)
	})

	const onRenameProject = useMemoizedFn((project_item: IProjectSerializedProjectItem) => {
		setTargetProject(project_item)
		setProjectName(project_item.name)
		setProjectDir(project_item.dir)
		setRenameOpen(true)
	})

	const onRemoveProject = useMemoizedFn((project_item: IProjectSerializedProjectItem) => {
		setTargetProject(project_item)
		setDeleteOpen(true)
	})

	const closeCreateDialog = useMemoizedFn(() => setCreateOpen(false))
	const closeRenameDialog = useMemoizedFn(() => setRenameOpen(false))
	const closeDeleteDialog = useMemoizedFn(() => setDeleteOpen(false))

	const submitCreateProject = useMemoizedFn(async () => {
		const next_dir = project_dir.trim()
		const next_name = getProjectNameFromDir(next_dir)

		if (!next_name || !next_dir) return

		await createProject({ name: next_name, dir: next_dir })
		setCreateOpen(false)
	})

	const submitRenameProject = useMemoizedFn(async () => {
		const next_target_project = target_project
		const next_name = project_name.trim()

		if (!next_target_project || !next_name) return

		await renameProject({ id: next_target_project.id, name: next_name })
		setRenameOpen(false)
	})

	const confirmRemoveProject = useMemoizedFn(async () => {
		const next_target_project = target_project

		if (!next_target_project) return

		await removeProject(next_target_project.id)
		setDeleteOpen(false)
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
					<div className='icon_button small' onClick={onCreateProject}>
						<Plus></Plus>
					</div>
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
								onRenameProject={onRenameProject}
								onRemoveProject={onRemoveProject}
								setSelectedProject={setSelectedProject}
							></Item>
						))}
					</div>
				</SortableContext>
			</DndContext>
			<ProjectFormDialog
				open={create_open}
				title='New Project'
				desc='Create a new project with a name and directory.'
				name_value={project_name}
				dir_value={project_dir}
				show_dir
				submit_text='Create'
				onChangeName={setProjectName}
				onChangeDir={setProjectDir}
				onSubmit={submitCreateProject}
				onClose={closeCreateDialog}
			></ProjectFormDialog>
			<ProjectFormDialog
				open={rename_open}
				title='Rename Project'
				desc='Update the project name.'
				name_value={project_name}
				show_dir={false}
				submit_text='Save'
				onChangeName={setProjectName}
				onSubmit={submitRenameProject}
				onClose={closeRenameDialog}
			></ProjectFormDialog>
			<Alert
				open={delete_open}
				title='Delete Project'
				desc={`Delete project \"${target_project?.name || ''}\"? This cannot be undone.`}
				confirm_text='Delete'
				cancel_text='Cancel'
				onConfirm={confirmRemoveProject}
				onCancel={closeDeleteDialog}
			></Alert>
		</div>
	)
}

export default $app.memo(Index)

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'

import { Alert, Tooltip } from '@/components'

import ProjectFormDialog from './ProjectFormDialog'
import ProjectListItem from './ProjectListItem'

import type { DragEndEvent } from '@dnd-kit/core'
import type { IProjectSerializedProjectItem } from '../types'

export interface IProps {
	projects: Array<IProjectSerializedProjectItem>
	selected_project_id: string
	project_directory_tree_paths: Array<string>
	create_open: boolean
	rename_open: boolean
	delete_open: boolean
	project_name: string
	project_dir: string
	target_project_name: string
	onOpenCreateProject: () => void
	onOpenRenameProject: (project_item: IProjectSerializedProjectItem) => void
	onOpenRemoveProject: (project_item: IProjectSerializedProjectItem) => void
	onCloseCreateDialog: () => void
	onCloseRenameDialog: () => void
	onCloseDeleteDialog: () => void
	onChangeProjectName: (value: string) => void
	onChangeProjectDir: (value: string) => void
	onSelectDirectoryPath: (selected_path: string) => void
	onSubmitCreateProject: () => void
	onSubmitRenameProject: () => void
	onConfirmRemoveProject: () => void
	onProjectDragEnd: (args: DragEndEvent) => void
	setSelectedProject: (id: string) => void
}

const Index = (props: IProps) => {
	const {
		projects,
		selected_project_id,
		project_directory_tree_paths,
		create_open,
		rename_open,
		delete_open,
		project_name,
		project_dir,
		target_project_name,
		onOpenCreateProject,
		onOpenRenameProject,
		onOpenRemoveProject,
		onCloseCreateDialog,
		onCloseRenameDialog,
		onCloseDeleteDialog,
		onChangeProjectName,
		onChangeProjectDir,
		onSelectDirectoryPath,
		onSubmitCreateProject,
		onSubmitRenameProject,
		onConfirmRemoveProject,
		onProjectDragEnd,
		setSelectedProject
	} = props
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center justify-between'>
				<div className='text-std-400 text-xs font-medium'>Projects</div>
				<Tooltip title='New Project'>
					<div className='icon_button small' onClick={onOpenCreateProject}>
						<Plus></Plus>
					</div>
				</Tooltip>
			</div>
			<DndContext collisionDetection={closestCenter} onDragEnd={onProjectDragEnd} sensors={sensors}>
				<SortableContext items={projects.map(item => item.id)} strategy={verticalListSortingStrategy}>
					<div className='flex flex-col gap-1'>
						{projects.map((project_item, project_index) => (
							<ProjectListItem
								project_item={project_item}
								project_index={project_index}
								selected={selected_project_id === project_item.id}
								onRenameProject={onOpenRenameProject}
								onRemoveProject={onOpenRemoveProject}
								setSelectedProject={setSelectedProject}
								key={project_item.id}
							></ProjectListItem>
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
				directory_tree_paths={project_directory_tree_paths}
				show_dir
				submit_text='Create'
				onChangeName={onChangeProjectName}
				onChangeDir={onChangeProjectDir}
				onSelectDirectoryPath={onSelectDirectoryPath}
				onSubmit={onSubmitCreateProject}
				onClose={onCloseCreateDialog}
			></ProjectFormDialog>
			<ProjectFormDialog
				open={rename_open}
				title='Rename Project'
				desc='Update the project name.'
				name_value={project_name}
				dir_value={project_dir}
				directory_tree_paths={project_directory_tree_paths}
				show_dir={false}
				submit_text='Save'
				onChangeName={onChangeProjectName}
				onChangeDir={onChangeProjectDir}
				onSelectDirectoryPath={onSelectDirectoryPath}
				onSubmit={onSubmitRenameProject}
				onClose={onCloseRenameDialog}
			></ProjectFormDialog>
			<Alert
				open={delete_open}
				title='Delete Project'
				desc={`Delete project "${target_project_name}"? This cannot be undone.`}
				confirm_text='Delete'
				cancel_text='Cancel'
				onConfirm={onConfirmRemoveProject}
				onCancel={onCloseDeleteDialog}
			></Alert>
		</div>
	)
}

export default $app.memo(Index)

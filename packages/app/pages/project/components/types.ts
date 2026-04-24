import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { IProjectSerializedProjectItem } from '../types'

export interface IPropsDialogShell {
	open: boolean
	title: string
	desc: string
	confirm_text: string
	children: ReactNode
	content_class?: string
	onConfirm: () => void
	onClose: () => void
}

export interface IPropsDirectoryTree {
	paths: Array<string>
	onSelectPath: (selected_path: string) => void
}

export interface IPropsFormDialog {
	open: boolean
	title: string
	desc: string
	name_value: string
	dir_value?: string
	directory_tree_paths?: Array<string>
	show_dir: boolean
	submit_text: string
	onChangeName: (value: string) => void
	onChangeDir?: (value: string) => void
	onSelectDirectoryPath: (selected_path: string) => void
	onSubmit: () => void
	onClose: () => void
}

export interface IPropsListItem {
	project_item: IProjectSerializedProjectItem
	project_index: number
	selected: boolean
	onRenameProject: (project_item: IProjectSerializedProjectItem) => void
	onRemoveProject: (project_item: IProjectSerializedProjectItem) => void
	setSelectedProject: (id: string) => void
}

export interface IPropsList {
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

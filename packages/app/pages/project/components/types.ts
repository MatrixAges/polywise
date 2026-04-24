import type { ReactNode } from 'react'
import type { IProjectSerializedProjectItem } from '../types'

export type IProjectFormDialogType = 'create' | 'rename'

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
}

export interface IPropsFormDialog {
	type: IProjectFormDialogType
	open: boolean
	title: string
	desc: string
	name_value: string
	dir_value?: string
	directory_tree_paths?: Array<string>
	show_dir: boolean
	submit_text: string
}

export interface IPropsListItem {
	project_item: IProjectSerializedProjectItem
	project_index: number
	selected: boolean
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
}

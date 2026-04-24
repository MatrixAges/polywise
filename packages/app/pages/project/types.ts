import type { RouterOutputs } from '@core/index'
import type {
	IProjectSerializedProjectItem as IRpcProjectSerializedProjectItem,
	IProjectSerializedSessionItem as IRpcProjectSerializedSessionItem,
	IProjectSerializedTodoItem as IRpcProjectSerializedTodoItem
} from '@core/rpc/project/types'
import type { ReactNode } from 'react'

export type IProjectSerializedProjectItem = IRpcProjectSerializedProjectItem

export type IProjectSerializedSessionItem = IRpcProjectSerializedSessionItem

export type IProjectSerializedTodoItem = IRpcProjectSerializedTodoItem

export interface IProjectTreeItem extends IFileListItem {
	children?: Array<IProjectTreeItem>
	content?: string
}

export type IFileListItem = RouterOutputs['file']['list'][number]

export type IHomeDir = RouterOutputs['file']['homedir']

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

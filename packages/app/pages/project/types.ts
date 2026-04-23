import type {
	IProjectListData,
	IProjectSerializedProjectItem as IRpcProjectSerializedProjectItem,
	IProjectSerializedSessionItem as IRpcProjectSerializedSessionItem,
	IProjectSerializedTodoItem as IRpcProjectSerializedTodoItem,
	IProjectTreeItem as IRpcProjectTreeItem
} from '@core/rpc/project/types'

export type IProjectSerializedProjectItem = IRpcProjectSerializedProjectItem

export type IProjectSerializedSessionItem = IRpcProjectSerializedSessionItem

export type IProjectSerializedTodoItem = IRpcProjectSerializedTodoItem

export interface IProjectTreeItem extends IRpcProjectTreeItem {
	children?: Array<IProjectTreeItem>
	content?: string
}

export type IProjectData = IProjectListData

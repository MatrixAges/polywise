import type { Project, Session, Todo } from '@core/db'

export interface IProjectTreeItem {
	id: string
	name: string
	dir: string
	file_type: 'directory' | 'file'
	has_children: boolean
}

export interface IProjectSerializedProjectItem extends Omit<Project, 'created_at' | 'updated_at'> {
	created_at: string | null
	updated_at: string | null
}

export interface IProjectSerializedSessionItem extends Omit<Session, 'created_at' | 'updated_at'> {
	created_at: string | null
	updated_at: string | null
	project_id: string
}

export interface IProjectSerializedTodoItem extends Omit<
	Todo,
	'created_at' | 'updated_at' | 'completed_at' | 'due_at'
> {
	created_at: string | null
	updated_at: string | null
	completed_at: string | null
	due_at: string | null
	project_id: string
}

export interface IProjectListData {
	projects: Array<IProjectSerializedProjectItem>
	sessions: Record<string, Array<IProjectSerializedSessionItem>>
	todos: Record<string, Array<IProjectSerializedTodoItem>>
	file_trees: Record<string, Array<IProjectTreeItem>>
	file_contents: Record<string, string>
	selected_project_id: string
	selected_session_id: string
	selected_file_path: string
	has_more_map: Record<string, boolean>
}

export interface IProjectMoreSessionsData {
	sessions: Array<IProjectSerializedSessionItem>
	has_more: boolean
}

export interface IProjectFileDetailData {
	content: string
}

import { createContext, useContext } from 'react'

import type Model from './model'

export interface IProjectContext extends Pick<
	Model,
	| 'openCreateProjectDialog'
	| 'openRenameProjectDialog'
	| 'openDeleteProjectDialog'
	| 'closeCreateDialog'
	| 'closeRenameDialog'
	| 'closeDeleteDialog'
	| 'setProjectName'
	| 'setProjectDir'
	| 'onSelectProjectDirectoryPath'
	| 'submitCreateProject'
	| 'submitRenameProject'
	| 'confirmRemoveProject'
	| 'onProjectDragEnd'
	| 'setSelectedProject'
	| 'toggleProject'
	| 'setSelectedSession'
	| 'createSession'
	| 'loadMoreSessions'
> {}

const project_context = createContext<IProjectContext | null>(null)

export const ProjectContext = project_context.Provider

export const useProjectContext = () => {
	return useContext(project_context)!
}

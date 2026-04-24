import { createContext, useContext } from 'react'

import type Model from './model'

export interface IProjectContext extends Pick<
	Model,
	| 'setProjectDirectorySkipNextReplace'
	| 'consumeProjectDirectorySkipNextReplace'
	| 'getProjectDirectoryInputPath'
	| 'ensureProjectDirectoryReady'
	| 'loadProjectDirectory'
> {}

const project_context = createContext<IProjectContext | null>(null)

export const ProjectContext = project_context.Provider

export const useProjectContext = () => {
	return useContext(project_context)!
}

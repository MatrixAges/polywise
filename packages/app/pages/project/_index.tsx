import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { FileTree, Session } from '@/components'
import { useModelContext } from '@/hooks'

import List from './components/List'
import { ProjectContext } from './context'
import Model from './model'

import type { IProjectContext } from './context'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const props_project_list = {
		projects: $copy(x.projects),
		sessions: $copy(x.sessions),
		selected_project_id: x.selected_project_id,
		selected_session_id: x.selected_session_id,
		expanded_project_map: $copy(x.expanded_project_map),
		has_more_map: $copy(x.has_more_map),
		loading_project_id: x.loading_project_id,
		project_directory_tree_paths: $copy(x.project_directory_tree_paths),
		create_open: x.create_open,
		rename_open: x.rename_open,
		delete_open: x.delete_open,
		project_name: x.project_name,
		project_dir: x.project_dir,
		target_project_name: x.target_project_name
	}

	const project_context = useModelContext<Model, IProjectContext>(x, {
		openCreateProjectDialog: x.openCreateProjectDialog,
		openRenameProjectDialog: x.openRenameProjectDialog,
		openDeleteProjectDialog: x.openDeleteProjectDialog,
		closeCreateDialog: x.closeCreateDialog,
		closeRenameDialog: x.closeRenameDialog,
		closeDeleteDialog: x.closeDeleteDialog,
		setProjectName: x.setProjectName,
		setProjectDir: x.setProjectDir,
		onSelectProjectDirectoryPath: x.onSelectProjectDirectoryPath,
		submitCreateProject: x.submitCreateProject,
		submitRenameProject: x.submitRenameProject,
		confirmRemoveProject: x.confirmRemoveProject,
		onProjectDragEnd: x.onProjectDragEnd,
		setSelectedProject: x.setSelectedProject,
		toggleProject: x.toggleProject,
		setSelectedSession: x.setSelectedSession,
		createSession: x.createSession,
		loadMoreSessions: x.loadMoreSessions
	})

	return (
		<div className='flex h-full overflow-hidden'>
			<div
				className='
					flex flex-col shrink-0
					w-[260px]
					border-r border-border-light
				'
			>
				<div className='flex-1 overflow-y-auto px-2 py-2'>
					<ProjectContext value={project_context}>
						<List {...props_project_list}></List>
					</ProjectContext>
				</div>
			</div>
			<div className='flex min-w-0 flex-1 flex-col'>
				<div
					className='
						px-3 py-2
						text-xs text-std-400 font-medium
						border-b border-border-light
					'
				>
					Session
				</div>
				<Session type='page' id={x.selected_session_id} input=''></Session>
			</div>

			<div
				className='
					flex flex-col shrink-0
					w-[360px]
					border-l border-border-light
				'
			>
				<div
					className='
						px-3 py-2
						text-xs text-std-400 font-medium
					'
				>
					Files
				</div>
				<div
					className='
						overflow-hidden
						flex flex-1 flex-col
						gap-2
						px-2 py-2
					'
				>
					{$copy(x.selected_project_tree_paths).length > 0 && (
						<FileTree
							paths={$copy(x.selected_project_tree_paths)}
							onSelectPath={x.setSelectedFilePath}
						></FileTree>
					)}
					{/* <div
						className='
							overflow-y-auto
							flex-1
							min-h-0
							p-2
							rounded-md
							border border-border-light
						'
					>
						{x.selected_file_patch ? (
							<PatchDiff
								patch={x.selected_file_patch}
								options={{
									diffStyle: 'unified',
									theme: { dark: 'github-dark', light: 'github-light' },
									themeType: 'light'
								}}
							></PatchDiff>
						) : (
							<div className='text-std-400 text-sm'>Select a file to view details</div>
						)}
					</div> */}
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

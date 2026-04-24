import { useEffect, useMemo, useState } from 'react'
import { PatchDiff } from '@pierre/diffs/react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { FileTree, Session } from '@/components'

import ProjectList from './components/ProjectList'
import Todos from './components/Todos'
import Model from './model'

const buildPatchFromContent = (file_path: string, content: string) => {
	const lines = content.split('\n')

	return [
		`--- a/${file_path}`,
		`+++ b/${file_path}`,
		`@@ -0,0 +1,${lines.length} @@`,
		...lines.map(line => `+${line}`)
	].join('\n')
}

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const selected_project_items = x.file_trees[x.selected_project_id] || []
	const tree_paths = useMemo(() => selected_project_items.map(item => item.dir), [selected_project_items])

	const patch = useMemo(() => {
		if (!x.selected_file_path || !x.selected_file_content) {
			return ''
		}

		return buildPatchFromContent(x.selected_file_path, x.selected_file_content)
	}, [x.selected_file_content, x.selected_file_path])

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
					<ProjectList
						projects={$copy(x.projects)}
						selected_project_id={x.selected_project_id}
						createProject={x.createProject}
						renameProject={x.renameProject}
						removeProject={x.removeProject}
						sortProject={x.sortProject}
						setSelectedProject={x.setSelectedProject}
					></ProjectList>
					<div className='border-border-light mt-3 border-t pt-3'>
						<Todos
							project_id={x.selected_project_id}
							todos={x.todos[x.selected_project_id] || []}
							createTodo={x.createTodo}
							removeTodo={x.removeTodo}
							renameTodo={x.renameTodo}
						></Todos>
					</div>
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
					<div
						className='
							overflow-y-auto
							flex-1
							min-h-0
							rounded-md
							border border-border-light
						'
					>
						<FileTree
							paths={tree_paths}
							initial_selected_paths={
								x.selected_file_path ? [x.selected_file_path] : undefined
							}
							className='
								overflow-y-auto
								flex-1
								min-h-0
								rounded-md
								border border-border-light
							'
							onSelectPath={x.setSelectedFilePath}
						></FileTree>
					</div>
					<div
						className='
							overflow-y-auto
							flex-1
							min-h-0
							p-2
							rounded-md
							border border-border-light
						'
					>
						{patch ? (
							<PatchDiff
								patch={patch}
								options={{
									diffStyle: 'unified',
									theme: { dark: 'github-dark', light: 'github-light' },
									themeType: 'light'
								}}
							></PatchDiff>
						) : (
							<div className='text-std-400 text-sm'>Select a file to view details</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

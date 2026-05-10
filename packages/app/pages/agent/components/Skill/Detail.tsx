import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { FileText, PencilLine } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { FileContent, FileTree, Tabs } from '@/components'

import { useModel } from './context'

const Index = () => {
	const {
		selected_skill,
		skill_files,
		selected_file,
		detail_mode,
		edit_content,
		setEditContent,
		setDetailMode,
		setFileTree,
		getTreeComposition,
		getTreeDragAndDrop,
		canRenameTreeItem,
		onTreeMutation,
		selectPath,
		saveSkill
	} = useModel()

	const onSelectPath = useMemoizedFn(args => {
		void selectPath(args)
	})

	useEffect(() => {
		return () => setFileTree(null)
	}, [setFileTree])

	if (!selected_skill) {
		return (
			<div
				className='
					flex flex-1
					items-center justify-center
					text-sm text-std-400
				'
			>
				Select a skill
			</div>
		)
	}

	return (
		<div className='flex min-w-0 flex-1'>
			<div
				className='
					overflow-y-hidden
					flex flex-col
					w-[220px] h-full
					border-border-light border-r
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-9
						px-2.5
						border-b border-border-light
					'
				>
					<div className='text-xsm text-std-500 font-medium'>Files</div>
				</div>
				<div className='flex-1'>
					<FileTree
						paths={$copy(skill_files.paths)}
						flex
						coloredIcons
						dragAndDrop={getTreeDragAndDrop()}
						renaming={{
							canRename: canRenameTreeItem
						}}
						composition={getTreeComposition()}
						onMutation={event => void onTreeMutation(event)}
						onReady={setFileTree}
						onSelectPath={onSelectPath}
						key={skill_files.tree_version}
					></FileTree>
				</div>
			</div>
			<div className='flex min-w-0 flex-1 flex-col'>
				<div className='flex min-h-0 flex-1'>
					{detail_mode === 'edit' ? (
						<Textarea
							className='
								flex-1
								h-full
								min-h-0
								rounded-none
								bg-transparent
								border-0
								focus-within:ring-0!
							'
							value={edit_content}
							onChange={event => setEditContent(event.target.value)}
						></Textarea>
					) : selected_file ? (
						<FileContent file={selected_file}></FileContent>
					) : (
						<div
							className='
									flex flex-1
									items-center justify-center
									text-sm text-std-400
								'
						>
							Select a file
						</div>
					)}
				</div>
				<div
					className='
						flex
						items-center justify-between
						h-9
						gap-3
						px-4
						border-t border-border-light
					'
				>
					<div className='text-std-400 truncate text-sm'>
						{selected_file?.path || `${selected_skill.path}/SKILL.md`}
					</div>
					<div className='flex items-center gap-2'>
						<Tabs
							items={[
								{ key: 'preview', Icon: FileText },
								{ key: 'edit', Icon: PencilLine }
							]}
							active={detail_mode}
							simple
							onClick={value => setDetailMode(value as 'preview' | 'edit')}
						></Tabs>
						<Button size='xs' onClick={() => void saveSkill()}>
							Save
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useEffect } from 'react'
import { File, Virtualizer } from '@pierre/diffs/react'
import { useMemoizedFn } from 'ahooks'
import { FileText, PencilLine } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { FileTree, Tabs } from '@/components'
import { useGlobal } from '@/context'

import { useModel } from '../context'

const Index = () => {
	const {
		selected_skill,
		skill_files,
		selected_file,
		detail_mode,
		edit_name,
		edit_desc,
		edit_content,
		file_preview_open,
		setEditName,
		setEditDesc,
		setEditContent,
		setDetailMode,
		toggleFilePreviewOpen,
		setFileTree,
		getTreeComposition,
		getTreeDragAndDrop,
		canRenameTreeItem,
		onTreeMutation,
		selectPath,
		saveSkill
	} = useModel()
	const global = useGlobal()

	const onSelectPath = useMemoizedFn(args => {
		void selectPath(args)
	})

	const onClickShowFiles = useMemoizedFn(() => {
		if (!file_preview_open) {
			toggleFilePreviewOpen()
		}
	})

	useEffect(() => {
		return () => setFileTree(null)
	}, [])

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
			<div className='flex min-w-0 flex-1 flex-col'>
				<div
					className='
						flex flex-col
						gap-3
						p-4
						border-b border-border-light
					'
				>
					<Input value={edit_name} onChange={event => setEditName(event.target.value)}></Input>
					<Textarea
						className='min-h-20'
						value={edit_desc}
						onChange={event => setEditDesc(event.target.value)}
					></Textarea>
					<div className='flex items-center justify-between gap-3'>
						<div className='text-std-400 text-sm'>
							{selected_file?.path || `${selected_skill.path}/SKILL.md`}
						</div>
						<div className='flex items-center gap-2'>
							{!file_preview_open && (
								<Button size='xs' variant='ghost' onClick={onClickShowFiles}>
									Files
								</Button>
							)}
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
				<div className='flex min-h-0 flex-1'>
					{detail_mode === 'edit' ? (
						<Textarea
							className='
								flex-1
								h-full
								min-h-0
								rounded-none
								border-0
							'
							value={edit_content}
							onChange={event => setEditContent(event.target.value)}
						></Textarea>
					) : selected_file ? (
						<div className='flex h-full w-full'>
							<Virtualizer
								className='
										overflow-y-scroll
										w-full h-full
										min-h-0 max-h-full
									'
								key={selected_file.path}
							>
								<File
									className='flex h-full w-full flex-col'
									file={$copy(selected_file)}
									options={{
										theme: `github-${global.theme.theme_value}`,
										overflow: 'wrap',
										unsafeCSS: `
											[data-diffs-header='default']{
												position:sticky;
												min-height:2.16rem;
												border-bottom:1px solid var(--color-border-light);
												font-size:12px;
											}

											[data-diffs-header='default'] svg{
												width:12px;
												height:12px;
											}

											[data-line-number-content]{
												font-family:var(--font-mono);
											}

											pre{
												padding:6px 0;
											}
										`
									}}
									style={{
										'--diffs-font-size': '12px',
										'--diffs-font-family': 'var(--font_family)',
										'--diffs-line-height': 1.62,
										'--diffs-tab-size': 10,
										'--diffs-fg-number': 'var(--color-std-300)'
									}}
								></File>
							</Virtualizer>
						</div>
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
			</div>
			{file_preview_open && (
				<div
					className='
						overflow-y-hidden
						flex flex-col
						w-[300px] h-full
						border-border-light border-l
					'
				>
					<div
						className='
							flex
							items-center justify-between
							h-8
							px-3
							border-b border-border-light
						'
					>
						<div className='text-xsm text-std-500 font-medium'>Files</div>
						<Button size='xs' variant='ghost' onClick={toggleFilePreviewOpen}>
							Hide
						</Button>
					</div>
					<div className='flex-1'>
						<FileTree
							paths={$copy(skill_files.paths)}
							flex
							colored_icons
							drag_and_drop={getTreeDragAndDrop()}
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
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

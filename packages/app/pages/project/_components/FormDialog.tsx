import { Input } from '@/__shadcn__/components/ui/input'

import { useProjectContext } from '../context'
import DialogShell from './DialogShell'
import DirectoryTree from './DirectoryTree'

import type { ChangeEvent, KeyboardEvent } from 'react'
import type { IPropsFormDialog } from '../types'

const Index = (props: IPropsFormDialog) => {
	const { type, open, title, desc, name_value, dir_value, directory_tree_paths, show_dir, submit_text } = props
	const {
		setProjectName,
		setProjectDir,
		submitCreateProject,
		submitRenameProject,
		closeCreateDialog,
		closeRenameDialog
	} = useProjectContext()
	const onSubmit = type === 'create' ? submitCreateProject : submitRenameProject
	const onClose = type === 'create' ? closeCreateDialog : closeRenameDialog

	return (
		<DialogShell
			open={open}
			title={title}
			desc={desc}
			confirm_text={submit_text}
			content_class='w-[540px] max-w-none!'
			onConfirm={onSubmit}
			onClose={onClose}
		>
			<div className='flex flex-col gap-3'>
				{show_dir ? (
					<div className='flex flex-col gap-3'>
						<Input
							placeholder='Project directory'
							value={dir_value || ''}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								setProjectDir(event.target.value)
							}
							onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
								if (event.key === 'Enter') {
									event.preventDefault()
									onSubmit()
								}
							}}
						></Input>
						<DirectoryTree paths={directory_tree_paths || []}></DirectoryTree>
					</div>
				) : (
					<Input
						placeholder='Project name'
						value={name_value}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							setProjectName(event.target.value)
						}
						onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								onSubmit()
							}
						}}
					></Input>
				)}
			</div>
		</DialogShell>
	)
}

export default $app.memo(Index)

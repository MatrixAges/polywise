import { Input } from '@/__shadcn__/components/ui/input'

import ProjectDialogShell from './ProjectDialogShell'
import ProjectDirectoryTree from './ProjectDirectoryTree'

import type { ChangeEvent, KeyboardEvent } from 'react'

interface IProps {
	open: boolean
	title: string
	desc: string
	name_value: string
	dir_value?: string
	directory_tree_paths?: Array<string>
	show_dir: boolean
	submit_text: string
	onChangeName: (value: string) => void
	onChangeDir?: (value: string) => void
	onSelectDirectoryPath: (selected_path: string) => void
	onSubmit: () => void
	onClose: () => void
}

const Index = (props: IProps) => {
	const {
		open,
		title,
		desc,
		name_value,
		dir_value,
		directory_tree_paths,
		show_dir,
		submit_text,
		onChangeName,
		onChangeDir,
		onSelectDirectoryPath,
		onSubmit,
		onClose
	} = props

	return (
		<ProjectDialogShell
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
								onChangeDir?.(event.target.value)
							}
							onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
								if (event.key === 'Enter') {
									event.preventDefault()
									onSubmit()
								}
							}}
						></Input>
						<ProjectDirectoryTree
							paths={directory_tree_paths || []}
							onSelectPath={onSelectDirectoryPath}
						></ProjectDirectoryTree>
					</div>
				) : (
					<Input
						placeholder='Project name'
						value={name_value}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							onChangeName(event.target.value)
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
		</ProjectDialogShell>
	)
}

export default $app.memo(Index)

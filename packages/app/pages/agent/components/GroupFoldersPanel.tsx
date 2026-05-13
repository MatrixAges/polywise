import { X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { FileTree, TextTabs } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const {
		selected_group_folders,
		selected_group_folder_path,
		group_files,
		setGroupFolderPath,
		selectGroupFilePath,
		closeGroupFolders
	} = useModel()

	return (
		<div
			className='
				overflow-y-hidden
				flex flex-col shrink-0
				w-[300px] h-full
				border-border-light border-l
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-9
					px-2.5
					border-border-light border-b
				'
			>
				<span className='text-sm font-medium'>Folders</span>
				<div className='flex items-center gap-2'>
					<TextTabs
						items={selected_group_folders.map(item => ({
							key: item.path,
							title: item.name
						}))}
						active={selected_group_folder_path}
						setActive={setGroupFolderPath}
					></TextTabs>
					<div className='bg-border-light mx-1 h-[14px] w-px'></div>
					<div className='icon_button small mr-[-3px]' onClick={closeGroupFolders}>
						<X></X>
					</div>
				</div>
			</div>
			<div className='flex-1'>
				{selected_group_folders.length ? (
					<FileTree
						paths={$copy(group_files.paths)}
						flex
						coloredIcons
						onSelectPath={selectGroupFilePath}
						key={group_files.tree_version}
					></FileTree>
				) : (
					<div
						className='
							flex
							items-center justify-center
							h-full
							text-sm text-std-400
						'
					>
						No folders linked
					</div>
				)}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

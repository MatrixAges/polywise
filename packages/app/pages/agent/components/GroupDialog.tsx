import { Fragment } from 'react'
import { Folder, Info, Plus, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/__shadcn__/components/ui/dialog'
import { Input } from '@/__shadcn__/components/ui/input'
import { Spinner } from '@/__shadcn__/components/ui/spinner'
import { FileTree, Tabs } from '@/components'
import { alert, uploadFile } from '@/utils'

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'
import GroupAvatar from './GroupAvatar'

const accept = '.jpg,.jpeg,.svg,.png,.webp,image/jpeg,image/png,image/svg+xml,image/webp'

const Index = () => {
	const {
		agents,
		editing_group,
		group_dialog_open,
		group_dialog_name,
		group_dialog_description,
		group_dialog_tab,
		group_dialog_selected_agent_ids,
		group_dialog_folders,
		group_dialog_photo,
		group_dialog_photo_url,
		group_dialog_files,
		create_group_loading,
		update_group_loading,
		setGroupDialogOpen,
		setGroupDialogTab,
		setGroupDialogName,
		setGroupDialogDescription,
		setGroupDialogPhoto,
		clearGroupDialogPhoto,
		toggleGroupDialogAgent,
		addGroupDialogFolder,
		removeGroupDialogFolder,
		submitGroupDialog,
		removeGroup
	} = useModel()
	const loading = create_group_loading || update_group_loading
	const mode = editing_group ? 'edit' : 'create'
	const next_name = group_dialog_name.trim()
	const selected_set = new Set(group_dialog_selected_agent_ids)
	const onUpload = async () => {
		const file = (await uploadFile({ max_count: 1, accept })) as File | false

		if (!(file instanceof File)) {
			return
		}

		const array_buffer = await file.arrayBuffer()
		const preview_url = URL.createObjectURL(file)

		setGroupDialogPhoto({
			photo: new Uint8Array(array_buffer),
			file_name: file.name,
			preview_url
		})
	}
	const onRemove = async () => {
		if (!editing_group || loading) {
			return
		}

		const res = await alert({
			title: 'Remove Group',
			desc: 'Confirm remove this group and all linked group sessions?'
		})

		if (!res) {
			return
		}

		await removeGroup(editing_group.id)
	}

	return (
		<Dialog open={group_dialog_open} onOpenChange={next_open => !loading && setGroupDialogOpen(next_open)}>
			<DialogContent className='w-[640px] max-w-none!'>
				<form
					className='flex flex-col gap-4'
					onSubmit={async event => {
						event.preventDefault()

						if (!next_name) return

						await submitGroupDialog()
					}}
				>
					<DialogHeader>
						<DialogTitle>{mode === 'create' ? 'Create Group' : 'Edit Group'}</DialogTitle>
						<DialogDescription>
							{group_dialog_tab === 'info'
								? 'Set the group name and description, then choose which agents participate in the shared group chat.'
								: 'Associate multiple folders with this group. These folders will be mounted read-write for all group agents.'}
						</DialogDescription>
					</DialogHeader>
					<div
						className='
							overflow-y-scroll
							flex flex-col
							max-h-[60vh]
							gap-4
						'
					>
						{group_dialog_tab === 'info' ? (
							<>
								<div
									className='
										flex flex-col
										items-center
										gap-3
										py-2
									'
								>
									<GroupAvatar
										item={{
											name: next_name || group_dialog_name || 'Group',
											photo: group_dialog_photo
										}}
										size={72}
										photo_url={group_dialog_photo_url}
										onUpload={onUpload}
										onClear={clearGroupDialogPhoto}
										disabled={loading}
									></GroupAvatar>
								</div>
								<div className='grid gap-3'>
									<Input
										autoFocus
										value={group_dialog_name}
										maxLength={120}
										placeholder='Group name'
										onChange={event => setGroupDialogName(event.target.value)}
									></Input>
									<Input
										value={group_dialog_description}
										maxLength={500}
										placeholder='Describe what this group is for'
										onChange={event =>
											setGroupDialogDescription(event.target.value)
										}
									></Input>
								</div>
								<div className='grid gap-2'>
									<div className='text-xsm text-std-500 font-medium'>Agents</div>
									<div
										className='
											grid grid-cols-4
											gap-2
											p-2
											rounded-md
											border border-border-light
										'
									>
										{agents.map(agent => {
											const active = selected_set.has(agent.id)

											return (
												<button
													className={$cx(
														`
													flex flex-col
													items-center justify-start
													gap-3
													px-3 pt-4
													pb-3
													rounded-md
													text-center
													border border-border-light
													transition-colors
												`,
														active &&
															'bg-active border-transparent'
													)}
													type='button'
													key={agent.id}
													onClick={() =>
														toggleGroupDialogAgent(agent.id)
													}
												>
													<AgentAvatar
														item={agent}
														size={48}
														clickable={false}
													></AgentAvatar>
													<div
														className='
														flex flex-col
														w-full
														min-w-0
														gap-1
													'
													>
														<div className='truncate text-sm font-medium'>
															{agent.name}
														</div>
														<div className='text-std-400 line-clamp-3 text-xs'>
															{agent.description ||
																'No description'}
														</div>
													</div>
												</button>
											)
										})}
									</div>
								</div>
							</>
						) : (
							<div className='flex flex-col gap-3'>
								<div className='flex gap-2'>
									<Input
										value={group_dialog_files.input_path}
										placeholder='Choose a folder path'
										onChange={event =>
											group_dialog_files.setInputPath(event.target.value)
										}
									></Input>
									<Button
										type='button'
										variant='outline'
										onClick={group_dialog_files.fetchPath}
									>
										Fetch
									</Button>
									<Button
										type='button'
										onClick={() => addGroupDialogFolder()}
										disabled={!group_dialog_files.input_path.trim()}
									>
										<Plus className='size-3.5'></Plus>
										Add
									</Button>
								</div>
								<FileTree
									paths={$copy(group_dialog_files.paths)}
									onSelectPath={group_dialog_files.selectPath}
									key={group_dialog_files.tree_version}
								></FileTree>
								<div className='grid gap-2'>
									<div className='text-xsm text-std-500 font-medium'>
										Selected Folders ({group_dialog_folders.length})
									</div>
									<div
										className='
											flex flex-col
											gap-2
											p-2
											rounded-md
											border border-border-light
										'
									>
										{group_dialog_folders.length ? (
											group_dialog_folders.map(folder => (
												<div
													className='
														flex
														items-center
														gap-3
														px-3 py-2
														rounded-md
														border border-border-light
													'
													key={folder.path}
												>
													<div className='min-w-0 flex-1'>
														<div className='truncate text-sm font-medium'>
															{folder.name}
														</div>
														<div className='text-std-400 truncate text-xs'>
															{folder.path}
														</div>
													</div>
													<button
														className='icon_button small'
														type='button'
														onClick={() =>
															removeGroupDialogFolder(
																folder.path
															)
														}
													>
														<X className='size-3'></X>
													</button>
												</div>
											))
										) : (
											<div
												className='
													px-1 py-6
													text-sm text-std-400
													text-center
												'
											>
												No folders selected
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
					<DialogFooter className='flex items-center justify-between sm:justify-between'>
						<Tabs
							items={[
								{ key: 'info', title: 'Info', Icon: Info },
								{ key: 'folders', title: 'Folders', Icon: Folder }
							]}
							active={group_dialog_tab}
							onClick={tab => setGroupDialogTab(tab as 'info' | 'folders')}
						></Tabs>
						<div className='flex items-center gap-2'>
							{editing_group && (
								<Fragment>
									<Button
										variant='destructive'
										type='button'
										onClick={onRemove}
										disabled={loading}
									>
										Remove Group
									</Button>
									<div className='bg-border-light mx-2 h-4 w-px'></div>
								</Fragment>
							)}
							<Button
								variant='outline'
								type='button'
								onClick={() => setGroupDialogOpen(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={
									!next_name || !group_dialog_selected_agent_ids.length || loading
								}
							>
								{loading && <Spinner className='size-3.5'></Spinner>}
								{mode === 'create'
									? create_group_loading
										? 'Creating...'
										: 'Create'
									: update_group_loading
										? 'Saving...'
										: 'Save'}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

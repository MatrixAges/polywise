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

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'

const Index = () => {
	const {
		agents,
		editing_group,
		group_dialog_open,
		group_dialog_name,
		group_dialog_description,
		group_dialog_selected_agent_ids,
		create_group_loading,
		update_group_loading,
		setGroupDialogOpen,
		setGroupDialogName,
		setGroupDialogDescription,
		toggleGroupDialogAgent,
		submitGroupDialog
	} = useModel()
	const loading = create_group_loading || update_group_loading
	const mode = editing_group ? 'edit' : 'create'
	const next_name = group_dialog_name.trim()
	const selected_set = new Set(group_dialog_selected_agent_ids)

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
							Set the group name and description, then choose which agents participate in
							the shared group chat.
						</DialogDescription>
					</DialogHeader>
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
							onChange={event => setGroupDialogDescription(event.target.value)}
						></Input>
					</div>
					<div className='grid gap-2'>
						<div className='text-xsm text-std-500 font-medium'>Agents</div>
						<div
							className='
								overflow-y-auto
								grid grid-cols-4
								max-h-[300px]
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
											active && 'bg-active border-transparent'
										)}
										type='button'
										key={agent.id}
										onClick={() => toggleGroupDialogAgent(agent.id)}
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
												{agent.description || 'No description'}
											</div>
										</div>
									</button>
								)
							})}
							{!agents.length && (
								<div
									className='
										col-span-3
										px-2 py-4
										text-std-400 text-sm
									'
								>
									Create agents first.
								</div>
							)}
						</div>
					</div>
					<DialogFooter>
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
							disabled={!next_name || !group_dialog_selected_agent_ids.length || loading}
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
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

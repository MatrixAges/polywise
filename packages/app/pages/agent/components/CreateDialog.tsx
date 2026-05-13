import { Keyboard, Sparkles } from 'lucide-react'
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
import { Tabs } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const {
		create_dialog_open,
		create_agent_mode,
		create_agent_purpose,
		create_agent_name,
		create_agent_role,
		create_agent_description,
		create_agent_loading,
		setCreateDialogOpen,
		setCreateAgentMode,
		setCreateAgentPurpose,
		setCreateAgentName,
		setCreateAgentRole,
		setCreateAgentDescription,
		submitCreateAgentDialog
	} = useModel()
	const next_purpose = create_agent_purpose.trim()
	const next_name = create_agent_name.trim()
	const next_role = create_agent_role.trim()
	const create_mode_items = [
		{ key: 'auto', title: 'Auto', Icon: Sparkles },
		{ key: 'input', title: 'Input', Icon: Keyboard }
	] as const

	return (
		<Dialog
			open={create_dialog_open}
			onOpenChange={next_open => !create_agent_loading && setCreateDialogOpen(next_open)}
		>
			<DialogContent className='w-[520px] max-w-none!'>
				<form
					className='flex flex-col gap-4'
					onSubmit={async event => {
						event.preventDefault()

						if (create_agent_mode === 'auto' && !next_purpose) {
							return
						}

						if (create_agent_mode === 'input' && (!next_name || !next_role)) {
							return
						}

						await submitCreateAgentDialog()
					}}
				>
					<DialogHeader>
						<DialogTitle>Create Agent</DialogTitle>
						<DialogDescription>
							{create_agent_mode === 'auto'
								? "Describe this agent's purpose in one sentence. The system will generate its role, prompt, soul, identity, and memory from that sentence."
								: 'Enter the basic agent info manually. Name, role, and description are set here, and the remaining fields stay empty.'}
						</DialogDescription>
					</DialogHeader>
					{create_agent_mode === 'auto' ? (
						<div className='flex flex-col gap-2'>
							<Input
								autoFocus
								value={create_agent_purpose}
								maxLength={120}
								placeholder='Example: Break complex product requests into clear execution plans'
								onChange={event => setCreateAgentPurpose(event.target.value)}
							></Input>
							<div className='text-std-400 text-xs'>
								Role will be generated and kept within 20 characters.
							</div>
						</div>
					) : (
						<div className='flex flex-col gap-3'>
							<Input
								autoFocus
								value={create_agent_name}
								maxLength={60}
								placeholder='Agent name'
								onChange={event => setCreateAgentName(event.target.value)}
							></Input>
							<div className='flex flex-col gap-2'>
								<Input
									value={create_agent_role}
									maxLength={20}
									placeholder='Role, e.g. Product Lead'
									onChange={event => setCreateAgentRole(event.target.value)}
								></Input>
								<div className='text-std-400 text-xs'>
									Required. Keep it under 20 characters; fewer than two words is
									recommended.
								</div>
							</div>
							<Input
								value={create_agent_description}
								maxLength={160}
								placeholder='Short description'
								onChange={event => setCreateAgentDescription(event.target.value)}
							></Input>
						</div>
					)}
					<DialogFooter className='flex items-center justify-between sm:justify-between'>
						<Tabs
							items={[...create_mode_items]}
							active={create_agent_mode}
							onClick={mode => setCreateAgentMode(mode as 'auto' | 'input')}
						></Tabs>
						<div className='flex items-center gap-2'>
							<Button
								variant='outline'
								type='button'
								onClick={() => setCreateDialogOpen(false)}
								disabled={create_agent_loading}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={
									create_agent_loading ||
									(create_agent_mode === 'auto'
										? !next_purpose
										: !next_name || !next_role)
								}
							>
								{create_agent_loading && <Spinner className='size-3.5'></Spinner>}
								{create_agent_loading ? 'Creating...' : 'Create'}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

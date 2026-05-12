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

const Index = () => {
	const {
		create_dialog_open,
		create_agent_purpose,
		create_agent_loading,
		setCreateDialogOpen,
		setCreateAgentPurpose,
		submitCreateAgentDialog
	} = useModel()
	const next_purpose = create_agent_purpose.trim()

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

						if (!next_purpose) {
							return
						}

						await submitCreateAgentDialog()
					}}
				>
					<DialogHeader>
						<DialogTitle>Create Agent</DialogTitle>
						<DialogDescription>
							Describe this agent&apos;s purpose in one sentence. The system will generate
							its prompt, soul, identity, and memory from that sentence.
						</DialogDescription>
					</DialogHeader>
					<Input
						autoFocus
						value={create_agent_purpose}
						maxLength={120}
						placeholder='Example: Break complex product requests into clear execution plans'
						onChange={event => setCreateAgentPurpose(event.target.value)}
					></Input>
					<DialogFooter>
						<Button
							variant='outline'
							type='button'
							onClick={() => setCreateDialogOpen(false)}
							disabled={create_agent_loading}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={!next_purpose || create_agent_loading}>
							{create_agent_loading && <Spinner className='size-3.5'></Spinner>}
							{create_agent_loading ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

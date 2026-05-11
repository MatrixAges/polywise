import { useEffect, useState } from 'react'
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

import { useModel } from '../context'

interface IProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const Index = ({ open, onOpenChange }: IProps) => {
	const { createAgent, create_agent_loading } = useModel()
	const [purpose, setPurpose] = useState('')

	useEffect(() => {
		if (!open) {
			setPurpose('')
		}
	}, [open])

	const next_purpose = purpose.trim()

	return (
		<Dialog open={open} onOpenChange={next_open => !create_agent_loading && onOpenChange(next_open)}>
			<DialogContent className='w-[520px] max-w-none!'>
				<form
					className='flex flex-col gap-4'
					onSubmit={async event => {
						event.preventDefault()

						if (!next_purpose) {
							return
						}

						await createAgent(next_purpose)
						onOpenChange(false)
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
						value={purpose}
						maxLength={120}
						placeholder='Example: Break complex product requests into clear execution plans'
						onChange={event => setPurpose(event.target.value)}
					></Input>
					<DialogFooter>
						<Button
							variant='outline'
							type='button'
							onClick={() => onOpenChange(false)}
							disabled={create_agent_loading}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={!next_purpose || create_agent_loading}>
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Session } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	if (x.session_id) {
		return (
			<Session
				type='global'
				id={x.session_id}
				draft_input={x.session_draft_input ?? undefined}
				show_session_mode_select={false}
				show_audit_mode_select={false}
			></Session>
		)
	}

	return (
		<div
			className='
				flex flex-col
				items-center justify-center
				h-full
				gap-3
				px-6
				text-center
			'
		>
			<div className='text-std-400 text-sm'>Create a dedicated post session for AI-assisted writing.</div>
			<Button disabled={x.ensuring_session} onClick={() => void x.ensureSession()}>
				{x.ensuring_session && <Loader2 className='size-4 animate-spin'></Loader2>}
				<span>Create session</span>
			</Button>
		</div>
	)
}

export default observer(Index)

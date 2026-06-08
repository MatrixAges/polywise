import { observer } from 'mobx-react-lite'

import { Dialog, Session } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { detail_session, session_open, toggleSessionOpen } = useModel()

	if (!detail_session) return null

	return (
		<Dialog
			className='w-[640px] max-w-none! gap-2 pb-3'
			open={session_open}
			title={detail_session.title}
			setOpen={toggleSessionOpen}
		>
			<Session type='dialog' id={detail_session!.id}></Session>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

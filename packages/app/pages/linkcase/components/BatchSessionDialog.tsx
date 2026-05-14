import { observer } from 'mobx-react-lite'

import { Dialog, Session } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<Dialog
			open={x.session_dialog_open}
			title='Linkcase Batch Session'
			desc='Session id: global_linkcase_session'
			className='w-[1100px] max-w-none! gap-4'
			maxHeight='h-[78vh]'
			setOpen={x.setSessionDialogOpen}
		>
			<div className='h-[68vh]'>
				<Session type='dialog' id={x.global_session_id}></Session>
			</div>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

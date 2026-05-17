import { observer } from 'mobx-react-lite'

import { Dialog, Session } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<Dialog
			open={x.session_dialog_open}
			title='Linkcase Batch Session'
			className='w-[800px] max-w-[80vw]!'
			maxHeight='h-[80vh]'
			setOpen={x.setSessionDialogOpen}
		>
			<Session type='dialog' id={x.global_session_id}></Session>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

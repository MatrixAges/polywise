import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Dialog, Session } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')

	return (
		<Dialog
			open={x.session_dialog_open}
			title={t('control.batch_session_title')}
			className='w-[640px] max-w-[80vw]! pb-4'
			maxHeight='h-[80vh]'
			setOpen={x.setSessionDialogOpen}
		>
			<Session type='dialog' id={x.global_session_id}></Session>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

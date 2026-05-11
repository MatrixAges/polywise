import { observer } from 'mobx-react-lite'

import { Session } from '@/components'

import { useModel } from '../context'
import SessionsMenu from './SessionsMenu'

const Index = () => {
	const { selected_agent, selected_session_id, session_menu_open } = useModel()

	if (!selected_agent) {
		return (
			<div
				className='
					flex flex-1
					items-center justify-center
					text-sm text-std-400
				'
			>
				Select an agent
			</div>
		)
	}

	return (
		<div
			className='
				overflow-hidden
				flex flex-1
				min-w-0
			'
		>
			{session_menu_open && <SessionsMenu></SessionsMenu>}
			{selected_session_id && <Session type='page' id={selected_session_id}></Session>}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

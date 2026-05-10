import { observer } from 'mobx-react-lite'

import { Session } from '@/components'

import { useModel } from '../context'
import SessionsMenu from './SessionsMenu'

const Index = () => {
	const { selected_agent, selected_session_id, setPageMode } = useModel()

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
			<SessionsMenu></SessionsMenu>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					bg-background
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-10
						gap-3
						px-4
						border-b border-border-light
					'
				>
					<div className='min-w-0'>
						<div className='truncate text-sm font-medium'>{selected_agent.name}</div>
						<div className='text-std-400 truncate text-xs'>
							{selected_agent.description || 'Chat sessions and history'}
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<button
							className='click_button text-xs'
							type='button'
							onClick={() => setPageMode('detail')}
						>
							Edit agent
						</button>
					</div>
				</div>
				<div className='min-h-0 flex-1 overflow-hidden'>
					{selected_session_id ? (
						<Session type='page' id={selected_session_id}></Session>
					) : (
						<div
							className='
								flex
								items-center justify-center
								h-full
								text-sm text-std-400
							'
						>
							Select a session
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

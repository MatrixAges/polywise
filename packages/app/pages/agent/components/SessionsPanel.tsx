import { Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Session } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { selected_session_id, createSession } = useModel()

	return (
		<div
			className='
				overflow-hidden
				flex
				h-full
				min-h-[360px]
				border border-border-light
			'
		>
			<SessionsMenu></SessionsMenu>
			<div className='flex min-w-0 flex-1 flex-col'>
				<div
					className='
						flex
						items-center justify-end
						h-8
						px-2
						border-b border-border-light
					'
				>
					<button className='icon_button small' type='button' onClick={createSession}>
						<Plus className='size-3.5'></Plus>
					</button>
				</div>
				<div className='min-h-0 flex-1'>
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

const SessionsMenu = () => {
	const { session_items, selected_session_id, setSelectedSession, loadMoreSessions, session_has_more } = useModel()

	return (
		<div
			className='
				flex flex-col
				w-[220px]
				border-r border-border-light
			'
		>
			<div
				className='
					h-8
					px-3
					text-xsm text-std-500 font-medium leading-8
					border-b border-border-light
				'
			>
				Sessions
			</div>
			<div
				className='
					overflow-y-scroll
					flex flex-1 flex-col
					min-h-0
					px-1.5 py-2
				'
			>
				{session_items.map(item => (
					<div
						className={$cx(
							`
							px-2 py-2
							rounded-lg
							text-sm
							clickable
						`,
							selected_session_id === item.id && 'bg-active'
						)}
						onClick={() => setSelectedSession(item.id)}
						key={item.id}
					>
						<div className='truncate font-medium'>{item.title}</div>
					</div>
				))}
				{session_has_more ? (
					<div
						className='
							px-2 py-2
							text-xs text-std-400
							clickable
						'
						onClick={loadMoreSessions}
					>
						Load more
					</div>
				) : null}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

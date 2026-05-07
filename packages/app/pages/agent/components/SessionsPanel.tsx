import { Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Session } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { selected_agent, selected_session_id, createSession, setPageMode } = useModel()

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
						h-12
						gap-3
						px-4
						border-b border-border-light
					'
				>
					<div className='min-w-0'>
						<div className='truncate text-sm font-medium'>{selected_agent.name}</div>
						<div className='text-std-400 truncate text-xs'>Chat sessions and history</div>
					</div>
					<div className='flex items-center gap-1'>
						<button
							className='click_button text-xs'
							type='button'
							onClick={() => setPageMode('detail')}
						>
							Edit agent
						</button>
						<button className='icon_button small' type='button' onClick={createSession}>
							<Plus className='size-3.5'></Plus>
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

const SessionsMenu = () => {
	const {
		selected_agent,
		session_items,
		selected_session_id,
		setSelectedSession,
		loadMoreSessions,
		session_has_more
	} = useModel()

	return (
		<div
			className='
				flex flex-col
				w-[240px]
				bg-card
				border-r border-border-light
			'
		>
			<div
				className='
					flex flex-col
					justify-center
					h-12
					gap-0.5
					px-3
					border-b border-border-light
				'
			>
				<div className='text-xsm text-std-500 font-medium'>Sessions</div>
				<div className='text-std-400 truncate text-xs'>
					{selected_agent?.description || 'Recent conversations'}
				</div>
			</div>
			<div
				className='
					overflow-y-scroll
					flex flex-1 flex-col
					min-h-0
					gap-1
					px-2 py-2
				'
			>
				{session_items.map(item => (
					<div
						className={$cx(
							`
							flex flex-col
							gap-0.5
							px-2.5 py-2.5
							rounded-xl
							text-sm
							clickable
						`,
							selected_session_id === item.id && 'bg-active'
						)}
						onClick={() => setSelectedSession(item.id)}
						key={item.id}
					>
						<div className='truncate font-medium'>{item.title}</div>
						<div className='text-std-400 truncate text-xs'>Open session</div>
					</div>
				))}
				{session_has_more ? (
					<div
						className='
							px-2.5 py-2
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

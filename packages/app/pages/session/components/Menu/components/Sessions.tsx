import { useMemoizedFn } from 'ahooks'

import type { IPropsSessions } from '../../../types'

const Index = (props: IPropsSessions) => {
	const { sessions, selected_session_id, setSelectedSession, onScroll } = props
	const handleSelectSession = useMemoizedFn((id: string) => setSelectedSession(id))

	return (
		<div className='flex-1 overflow-y-auto p-3' onScroll={onScroll}>
			<div className='flex flex-col gap-1'>
				{sessions.map(item => {
					const onClick = () => handleSelectSession(item.id)

					return (
						<button
							className={$cx(
								'rounded-md px-3 py-2 text-left',
								selected_session_id === item.id && 'bg-muted'
							)}
							onClick={onClick}
							key={item.id}
						>
							{item.title}
						</button>
					)
				})}
			</div>
		</div>
	)
}

export default $app.memo(Index)

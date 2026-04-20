import { useMemoizedFn } from 'ahooks'

import SessionItem from './SessionItem'

import type { IPropsSessionList } from '../types'

const Index = (props: IPropsSessionList) => {
	const { sessions, selected_session_id, setSelectedSession, loadMore } = props
	const on_scroll = useMemoizedFn((event: React.UIEvent<HTMLDivElement>) => {
		const target = event.currentTarget
		const is_near_bottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24

		if (is_near_bottom) {
			loadMore()
		}
	})

	return (
		<div onScroll={on_scroll}>
			{sessions.map(item => (
				<SessionItem
					item={item}
					selected_session_id={selected_session_id}
					setSelectedSession={setSelectedSession}
					key={item.id}
				></SessionItem>
			))}
		</div>
	)
}

export default $app.memo(Index)

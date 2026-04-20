import { useMemoizedFn } from 'ahooks'

import type { IPropsSessionItem } from '../types'

const Index = (props: IPropsSessionItem) => {
	const { item, selected_session_id, setSelectedSession } = props
	const on_click = useMemoizedFn(() => setSelectedSession(item.id))

	return <button onClick={on_click}>{item.title}</button>
}

export default $app.memo(Index)

import { useMemoizedFn } from 'ahooks'

import type { IPropsGroupItem } from '../types'

const Index = (props: IPropsGroupItem) => {
	const { item, selected_session_id, setSelectedSession } = props
	const on_click = useMemoizedFn(() => setSelectedSession(item.id))

	return <button onClick={on_click}>{item.title}</button>
}

export default $app.memo(Index)

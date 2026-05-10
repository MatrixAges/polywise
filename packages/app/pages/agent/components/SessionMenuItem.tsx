import { useModel } from '../context'
import MenuSessionItem from './MenuSessionItem'

import type { IAgentSessionMenuItemProps } from '../types'

const Index = (props: IAgentSessionMenuItemProps) => {
	const { item, pin, selected, renaming, rename_value, session_index } = props
	const { setSelectedSession } = useModel()

	return (
		<MenuSessionItem
			item={item}
			pin={pin}
			session_index={session_index}
			selected={selected}
			renaming={renaming}
			rename_value={rename_value}
			onClick={() => setSelectedSession(item.id)}
		></MenuSessionItem>
	)
}

export default $app.memo(Index)

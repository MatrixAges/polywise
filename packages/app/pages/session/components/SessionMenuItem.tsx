import { useModel } from '../context'
import MenuSessionItem from './MenuSessionItem'

import type { IPropsSessionMenuItem } from '../types'

const Index = (props: IPropsSessionMenuItem) => {
	const { item, pin, selected, renaming, rename_value, session_index } = props
	const { selectSession } = useModel()

	return (
		<MenuSessionItem
			item={item}
			pin={pin}
			session_index={session_index}
			selected={selected}
			renaming={renaming}
			rename_value={rename_value}
			onClick={() => selectSession(item.id)}
		></MenuSessionItem>
	)
}

export default $app.memo(Index)

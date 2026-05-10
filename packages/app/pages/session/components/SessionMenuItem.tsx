import { useModel } from '../context'
import MenuSessionItem from './MenuSessionItem'

import type { IPropsSessionMenuItem } from '../types'

const Index = (props: IPropsSessionMenuItem) => {
	const { item, pin, selected, renaming, renameValue, sessionIndex } = props
	const { selectGlobalSession } = useModel()

	return (
		<MenuSessionItem
			item={item}
			pin={pin}
			sessionIndex={sessionIndex}
			selected={selected}
			renaming={renaming}
			renameValue={renameValue}
			onClick={() => selectGlobalSession(item.id)}
		></MenuSessionItem>
	)
}

export default $app.memo(Index)

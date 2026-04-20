import GroupItem from './GroupItem'

import type { IPropsGroupList } from '../types'

const Index = (props: IPropsGroupList) => {
	const { groups, selected_session_id, setSelectedSession } = props

	return (
		<div>
			{groups.map(group_item => (
				<div key={group_item.group}>
					<div>{group_item.group}</div>
					<div>
						{group_item.items.map(item => (
							<GroupItem
								item={item}
								selected_session_id={selected_session_id}
								setSelectedSession={setSelectedSession}
								key={item.id}
							></GroupItem>
						))}
					</div>
				</div>
			))}
		</div>
	)
}

export default $app.memo(Index)

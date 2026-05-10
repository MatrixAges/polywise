import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import MenuSessionItem from './MenuSessionItem'

import type { IPropsProjectMenuItem } from '../types'

const Index = (props: IPropsProjectMenuItem) => {
	const { item, project_id, project_index, session_index, selected, renaming } = props
	const { title } = item
	const { rename_value, selectProjectSession } = useModel()

	const onClick = () => {
		if (renaming) return

		selectProjectSession({
			project_id,
			project_index,
			session_id: item.id
		})
	}

	return (
		<MenuSessionItem
			item={item}
			session_index={session_index}
			selected={selected}
			renaming={renaming}
			rename_value={rename_value}
			project_index={project_index}
			title={
				<div
					className='
						flex flex-1
						min-w-0
						gap-2
						truncate
					'
				>
					<span>-</span>
					{title}
				</div>
			}
			on_click={onClick}
		></MenuSessionItem>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

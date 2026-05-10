import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import MenuSessionItem from './MenuSessionItem'

import type { IPropsProjectMenuItem } from '../types'

const Index = (props: IPropsProjectMenuItem) => {
	const { item, projectId, projectIndex, sessionIndex, selected, renaming } = props
	const { title } = item
	const { rename_value, selectProjectSession } = useModel()

	const onClick = () => {
		if (renaming) return

		selectProjectSession({
			project_id: projectId,
			project_index: projectIndex,
			session_id: item.id
		})
	}

	return (
		<MenuSessionItem
			item={item}
			sessionIndex={sessionIndex}
			selected={selected}
			renaming={renaming}
			renameValue={rename_value}
			projectIndex={projectIndex}
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
			onClick={onClick}
		></MenuSessionItem>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

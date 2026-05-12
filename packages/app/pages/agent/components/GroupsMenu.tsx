import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import GroupMenuItem from './GroupMenuItem'

interface IProps {
	onEditGroup: (id: string) => void
}

const Index = ({ onEditGroup }: IProps) => {
	const { groups, selected_group_id, openGroup } = useModel()

	return (
		<div className='flex flex-col gap-0.5'>
			{groups.map(item => (
				<GroupMenuItem
					item={item}
					selected={selected_group_id === item.id}
					key={item.id}
					onClick={() => void openGroup(item.id)}
					onEdit={() => onEditGroup(item.id)}
				></GroupMenuItem>
			))}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

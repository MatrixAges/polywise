import { useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Session } from '@/components'

import { useModel } from '../context'
import GroupAvatar from './GroupAvatar'

const Index = () => {
	const { selected_group, selected_group_session_id, openGroup, openEditGroupDialog } = useModel()

	useEffect(() => {
		if (selected_group && !selected_group_session_id) {
			void openGroup(selected_group.id)
		}
	}, [openGroup, selected_group, selected_group_session_id])

	if (!selected_group) {
		return (
			<div
				className='
					flex flex-1
					items-center justify-center
					text-sm text-std-400
				'
			>
				Select a group
			</div>
		)
	}

	return (
		<div
			className='
				flex flex-1 flex-col
				h-full
				min-w-0
			'
		>
			{selected_group_session_id && <Session type='dialog' id={selected_group_session_id}></Session>}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

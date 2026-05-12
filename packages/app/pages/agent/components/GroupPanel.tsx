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
		<>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-12
						px-4
						border-b border-border-light
					'
				>
					<div className='flex min-w-0 items-center gap-3'>
						<GroupAvatar item={selected_group} size='small'></GroupAvatar>
						<div className='min-w-0'>
							<div className='truncate text-sm font-medium'>{selected_group.name}</div>
							<div className='text-xsm text-std-400 truncate'>
								{selected_group.description || `${selected_group.agents.length} agents`}
							</div>
						</div>
					</div>
					<button
						className='icon_button small'
						type='button'
						onClick={() => openEditGroupDialog(selected_group.id)}
					>
						<Pencil className='size-3'></Pencil>
					</button>
				</div>
				<div className='min-h-0 flex-1'>
					{selected_group_session_id ? (
						<Session type='dialog' id={selected_group_session_id}></Session>
					) : (
						<div
							className='
								flex
								items-center justify-center
								h-full
								text-sm text-std-400
							'
						>
							Preparing group chat...
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

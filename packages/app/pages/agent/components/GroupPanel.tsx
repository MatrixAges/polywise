import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Session } from '@/components'

import { useModel } from '../context'
import GroupDialog from './GroupDialog'

const Index = () => {
	const { selected_group, selected_group_session_id, openGroup } = useModel()
	const [edit_open, setEditOpen] = useState(false)

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
					<div className='min-w-0'>
						<div className='truncate text-sm font-medium'>{selected_group.name}</div>
						<div className='text-xsm text-std-400 truncate'>
							{selected_group.description || `${selected_group.agents.length} agents`}
						</div>
					</div>
					<button className='icon_button small' type='button' onClick={() => setEditOpen(true)}>
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
			<GroupDialog open={edit_open} group={selected_group} onOpenChange={setEditOpen}></GroupDialog>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

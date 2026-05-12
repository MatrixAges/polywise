import { useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Session } from '@/components'

import { useModel } from '../context'
import GroupAvatar from './GroupAvatar'

import type { SessionSyncStateHookArgs, SessionSyncStateHookResult } from '@/components/Session'

const useGroupSyncState = (_args: SessionSyncStateHookArgs): SessionSyncStateHookResult => {
	const { selected_group_session_status } = useModel()

	return {
		group_streaming: selected_group_session_status?.running
	}
}

const Index = () => {
	const {
		selected_group,
		selected_group_session_id,
		selected_group_session_status,
		openGroup,
		openEditGroupDialog
	} = useModel()

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
			{selected_group_session_id && (
				<Session
					type='dialog'
					id={selected_group_session_id}
					group_streaming={selected_group_session_status?.running}
					useSyncState={useGroupSyncState}
				></Session>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useEffect } from 'react'
import { Folders } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { FileContent, Session } from '@/components'

import { useModel } from '../context'
import GroupFoldersPanel from './GroupFoldersPanel'

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
		group_side_panel_open,
		group_content_tab,
		group_files,
		openGroup,
		toggleGroupFolders,
		syncGroupFolderPanel
	} = useModel()

	useEffect(() => {
		if (selected_group && !selected_group_session_id) {
			void openGroup(selected_group.id)
		}
	}, [openGroup, selected_group, selected_group_session_id])

	useEffect(() => {
		if (group_side_panel_open) {
			void syncGroupFolderPanel()
		}
	}, [group_side_panel_open, selected_group?.id, syncGroupFolderPanel])

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
			<div className='flex h-full min-w-0 flex-1'>
				<div className='flex min-w-0 flex-1'>
					{group_content_tab === 'session'
						? selected_group_session_id && (
								<Session
									type='page'
									id={selected_group_session_id}
									show_loading_dots={false}
									actions={
										<div className='flex items-center'>
											<span
												className='icon_button small'
												onClick={toggleGroupFolders}
											>
												<Folders></Folders>
											</span>
										</div>
									}
									group_streaming={selected_group_session_status?.running}
									useSyncState={useGroupSyncState}
								></Session>
							)
						: group_files.select_file && (
								<FileContent file={group_files.select_file}></FileContent>
							)}
				</div>
				{group_side_panel_open && <GroupFoldersPanel></GroupFoldersPanel>}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

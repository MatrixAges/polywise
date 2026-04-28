import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'

import { ArrowLeft, Grip } from '@/components/animate'
import RenameInput from '@/pages/session/components/RenameInput'

import { useModel } from '../context'

import type { IPropsSessionItem } from '../types'

const Index = (props: IPropsSessionItem) => {
	const { item, project_id, project_index, session_index, selected, renaming } = props
	const { title, unread } = item
	const {
		rename_value,
		setSelectedProject,
		setSelectedSession,
		onChangeRenameValue,
		onCancelRename,
		renameSession
	} = useModel()

	const Status = useMemo(() => {
		if (item.is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='text-std-300! size-3' />

		return null
	}, [item.is_runing, unread])

	const onClick = () => {
		if (renaming) return

		setSelectedProject(project_id, true)
		setSelectedSession(item.id)
	}

	return (
		<div
			className={$cx('click_button group', renaming && 'no_transition', selected && 'active')}
			onClick={onClick}
			data-project-index={project_index}
			data-session-index={session_index}
			data-id={item.id}
		>
			<div
				className='
					flex flex-1
					min-w-0
					gap-2
					truncate
				'
			>
				<span>-</span>
				{renaming ? (
					<RenameInput
						active={renaming}
						value={rename_value}
						setRenameValue={onChangeRenameValue}
						submitRename={renameSession}
						cancelRename={onCancelRename}
					></RenameInput>
				) : (
					title
				)}
			</div>
			{Status}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { useMemoizedFn } from 'ahooks'
import { ChevronDown, ChevronRight, MessageCirclePlus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import RenameInput from '@/pages/session/components/RenameInput'

import { useModel } from '../context'
import SessionItem from './SessionItem'

import type { MouseEvent } from 'react'
import type { IPropsMenuItem } from '../types'

const Index = (props: IPropsMenuItem) => {
	const { item, index } = props
	const { project, sessions } = item
	const {
		selected_session_id,
		rename_project_id,
		rename_session_id,
		rename_value,
		createSession,
		setSelectedProject,
		onChangeRenameValue,
		onCancelRename,
		renameProject
	} = useModel()
	const renaming = rename_project_id === project.id

	const onClickProject = useMemoizedFn(() => {
		if (renaming) return

		setSelectedProject(project.id)
	})

	const onSubmitRenameProject = useMemoizedFn(() => {
		renameProject(project)
	})

	const onCreateSession = useMemoizedFn((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		createSession(project.id)
	})

	return (
		<div
			className='
				flex flex-col
				w-full
			'
		>
			<div
				className='
					justify-between
					py-1
					pl-1.5 pr-1
					click_button select-none
				'
				data-project-index={index}
				data-session-index={-1}
				data-id={project.id}
				onClick={onClickProject}
			>
				<div className='flex items-center gap-1.5'>
					<ChevronRight size={12}></ChevronRight>
					<div className='min-w-0 flex-1'>
						{renaming ? (
							<RenameInput
								active={renaming}
								value={rename_value}
								setRenameValue={onChangeRenameValue}
								submitRename={onSubmitRenameProject}
								cancelRename={onCancelRename}
							></RenameInput>
						) : (
							<span className='truncate capitalize'>{project.name}</span>
						)}
					</div>
				</div>
				<button type='button' className='icon_button small' onClick={onCreateSession}>
					<MessageCirclePlus></MessageCirclePlus>
				</button>
			</div>
			<div className='flex flex-col'>
				{sessions.map((it, idx) => (
					<SessionItem
						item={it}
						project_id={project.id}
						project_index={index}
						session_index={idx}
						renaming={rename_session_id === it.id}
						selected={selected_session_id === it.id}
						key={it.id}
					></SessionItem>
				))}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

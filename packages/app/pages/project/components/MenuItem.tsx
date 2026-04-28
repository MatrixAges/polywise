import { useMemoizedFn } from 'ahooks'
import { FolderIcon, MessageSquarePlus } from 'lucide-react'

import { useModel } from '../context'
import SessionItem from './SessionItem'

import type { MouseEvent } from 'react'
import type { IPropsMenuItem } from '../types'

const Index = (props: IPropsMenuItem) => {
	const { item, index } = props
	const { project, sessions } = item
	const { createSession, selected_session_id, setSelectedProject } = useModel()

	const onClickProject = useMemoizedFn(() => {
		setSelectedProject(project.id)
	})

	const onCreateSession = useMemoizedFn((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		createSession(project.id)
	})

	return (
		<div className='flex flex-col'>
			<div
				className='
					justify-between
					py-1
					click_button select-none
				'
				data-project-index={index}
				data-session-index={-1}
				data-id={project.id}
				onClick={onClickProject}
			>
				<div className='flex items-center gap-1.5'>
					<FolderIcon size={12}></FolderIcon>
					<span className='capitalize'>{project.name}</span>
				</div>
				<button type='button' className='icon_button small' onClick={onCreateSession}>
					<MessageSquarePlus></MessageSquarePlus>
				</button>
			</div>
			<div className='flex flex-col'>
				{sessions.map((it, idx) => (
					<SessionItem
						item={it}
						project_id={project.id}
						project_index={index}
						session_index={idx}
						selected={selected_session_id === it.id}
						key={it.id}
					></SessionItem>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)

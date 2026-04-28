import { useMemoizedFn } from 'ahooks'
import { Ellipsis, FolderIcon, MessageSquarePlus } from 'lucide-react'

import { useModel } from '../context'

import type { MouseEvent } from 'react'
import type { IPropsMenuItem } from '../types'

const Index = (props: IPropsMenuItem) => {
	const { item, index } = props
	const { project, sessions } = item
	const { createSession, setSelectedProject, setSelectedSession } = useModel()

	const onClickProject = useMemoizedFn(() => {
		setSelectedProject(project.id)
	})

	const onClickCreateSession = useMemoizedFn((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		void createSession({ project_id: project.id })
	})

	const onClickSession = useMemoizedFn((session_id: string) => {
		setSelectedProject(project.id)

		setSelectedSession(session_id)
	})

	const stopPropagation = useMemoizedFn((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()
	})

	return (
		<div className='flex flex-col'>
			<div
				className='
					flex
					items-center justify-between
					gap-2
					py-1
					pl-2.5 pr-1.5
					rounded-full
					text-std-400 text-sm font-medium
					hover:text-std-900 active:bg-click
					select-none
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
				<div className='flex gap-1'>
					<button type='button' className='icon_button small' onClick={onClickCreateSession}>
						<MessageSquarePlus></MessageSquarePlus>
					</button>
					<button type='button' className='icon_button small' onClick={stopPropagation}>
						<Ellipsis></Ellipsis>
					</button>
				</div>
			</div>
			<div className='flex flex-col'>
				{sessions.map((it, index) => (
					<div
						className='
							flex
							py-1
							pl-6 pr-2
							text-sm text-std-400
							hover:text-std-900
							select-none
						'
						data-project-index={props.index}
						data-session-index={index}
						data-id={it.id}
						onClick={() => onClickSession(it.id)}
						key={it.id}
					>
						{it.title}
					</div>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)

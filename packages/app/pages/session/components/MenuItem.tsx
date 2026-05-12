import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'
import { ChevronDown, ChevronRight, Folders, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import RenameInput from '@/pages/session/components/RenameInput'

import { useModel } from '../context'
import ProjectMenuItem from './ProjectMenuItem'

import type { MouseEvent } from 'react'
import type { IPropsMenuItem } from '../types'

const Index = (props: IPropsMenuItem) => {
	const { item, index, renaming, selected, expand } = props
	const { project, sessions, has_more } = item
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({ id: project.id })
	const {
		project_selected_session_id,
		rename_session_id,
		rename_value,
		createSession,
		setSelectedProject,
		onChangeRenameValue,
		onCancelRename,
		renameProject,
		getMoreSessions,
		setFilesProjectId
	} = useModel()

	const onClickProject = useMemoizedFn(() => {
		if (renaming) return

		setSelectedProject(project.id)
	})

	const onSubmitRenameProject = useMemoizedFn(() => {
		renameProject(project)
	})

	const onCreateSession = useMemoizedFn((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()

		void createSession(project.id)
	})

	const LeftIcon = expand ? ChevronDown : ChevronRight
	const props_drag = renaming ? {} : { ...attributes, ...listeners }

	return (
		<div
			className='
				flex flex-col
				w-full
			'
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
		>
			<div
				className={$cx(
					`
					justify-between
					px-0 py-1
					bg-transparent
					group
					click_button select-none
				`,
					selected && 'active',
					isDragging && 'dragging z-10 backdrop-blur-lg'
				)}
				data-project-index={index}
				data-session-index={-1}
				data-id={project.id}
			>
				<div
					className='
						flex flex-1
						items-center
						gap-1
						truncate
					'
					onClick={onClickProject}
				>
					<LeftIcon size={12}></LeftIcon>
					<div className='min-w-0 flex-1 truncate'>
						{renaming ? (
							<RenameInput
								active={renaming}
								value={rename_value}
								set_rename_value={onChangeRenameValue}
								submit_rename={onSubmitRenameProject}
								cancel_rename={onCancelRename}
							></RenameInput>
						) : (
							<span className='capitalize'>{project.name}</span>
						)}
					</div>
				</div>
				<div className='flex'>
					<button
						className='
							opacity-0
							group-hover:opacity-100
							icon_button small cursor-grab
						'
						type='button'
						{...props_drag}
					>
						<DotsSixVerticalIcon className='size-3.5' weight='bold'></DotsSixVerticalIcon>
					</button>
					<button
						className='
							opacity-0
							group-hover:opacity-100
							icon_button small
						'
						type='button'
						onClick={() => setFilesProjectId(index)}
					>
						<Folders className='size-3'></Folders>
					</button>
					<button className='icon_button small' type='button' onClick={onCreateSession}>
						<Plus className='size-3'></Plus>
					</button>
				</div>
			</div>
			{expand && (
				<div className='flex flex-col gap-1'>
					{sessions.map((it, idx) => (
						<ProjectMenuItem
							item={it}
							project_id={project.id}
							project_index={index}
							session_index={idx}
							renaming={rename_session_id === it.id}
							selected={project_selected_session_id === it.id}
							key={it.id}
						></ProjectMenuItem>
					))}
					{has_more && (
						<div className='click_button pl-6' onClick={() => getMoreSessions(index)}>
							Loadmore
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

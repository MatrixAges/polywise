import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	ChevronRight,
	Ellipsis,
	Folder,
	FolderOpen,
	GripVertical,
	MessageSquare,
	PencilLine,
	Plus,
	Trash2
} from 'lucide-react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/__shadcn__/components/ui/dropdown-menu'

import { useProjectContext } from '../context'

import type { MouseEvent } from 'react'
import type { IPropsListItem } from '../types'

const Index = (props: IPropsListItem) => {
	const { project_item, project_index, sessions, selected, selected_session_id, expanded, has_more, loading } =
		props
	const {
		setSelectedProject,
		toggleProject,
		setSelectedSession,
		createSession,
		loadMoreSessions,
		openRenameProjectDialog,
		openDeleteProjectDialog
	} = useProjectContext()
	const { attributes, listeners, transform, transition, setNodeRef, isDragging } = useSortable({
		id: project_item.id
	})
	const FolderIcon = expanded ? FolderOpen : Folder

	const onClickProject = () => {
		const next_expanded = !expanded

		setSelectedProject(project_item.id)

		if (!next_expanded) {
			toggleProject(project_item.id)
		}
	}

	const onClickCreateSession = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()
		createSession({ project_id: project_item.id })
	}

	const onClickSession = (session_id: string) => {
		setSelectedProject(project_item.id)
		setSelectedSession(session_id)
	}

	const onClickLoadMore = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()
		loadMoreSessions(project_item.id)
	}

	return (
		<div
			className={$cx(
				`
				flex flex-col
				gap-1
			`,
				isDragging && 'opacity-60'
			)}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			data-project-index={project_index}
		>
			<div
				className={$cx(
					`
					flex
					items-center
					gap-1.5
					px-1.5 py-1
					rounded
					text-sm
					hover:bg-std-100
					clickable
				`,
					selected && 'active'
				)}
				onClick={onClickProject}
			>
				<ChevronRight
					className={$cx('text-std-400 size-3 transition-transform', expanded && 'rotate-90')}
				/>
				<FolderIcon className='text-std-500 size-4'></FolderIcon>
				<div className='min-w-0 flex-1 truncate font-medium'>{project_item.name}</div>
				<button type='button' className='icon_button small' onClick={onClickCreateSession}>
					<Plus></Plus>
				</button>
				<button
					type='button'
					className='icon_button small'
					{...attributes}
					{...listeners}
					onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
				>
					<GripVertical></GripVertical>
				</button>
				<DropdownMenu>
					<DropdownMenuTrigger
						onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
					>
						<div className='icon_button small'>
							<Ellipsis></Ellipsis>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent className='min-w-[140px]'>
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={() => openRenameProjectDialog(project_item)}>
								<PencilLine></PencilLine>
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem
								variant='destructive'
								onClick={() => openDeleteProjectDialog(project_item)}
							>
								<Trash2></Trash2>
								Delete
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{expanded && (
				<div className='ml-6 flex flex-col gap-0.5'>
					{sessions.map(session_item => (
						<div
							className={$cx(
								`
								flex
								items-center
								gap-1.5
								px-2 py-1
								rounded
								text-xs text-std-500
								hover:bg-std-100
								clickable
							`,
								selected_session_id === session_item.id && 'active text-std-800'
							)}
							onClick={() => onClickSession(session_item.id)}
							key={session_item.id}
						>
							<MessageSquare className='text-std-400 size-3'></MessageSquare>
							<span className='truncate'>{session_item.title || 'Untitled Session'}</span>
						</div>
					))}
					{has_more && (
						<button
							type='button'
							className='
								px-2 py-1
								text-xsm text-std-400
								text-left
								disabled:cursor-not-allowed disabled:opacity-50
								hover:text-std-800
								clickable
							'
							onClick={onClickLoadMore}
							disabled={loading}
						>
							{loading ? 'Loading...' : 'Show more'}
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)

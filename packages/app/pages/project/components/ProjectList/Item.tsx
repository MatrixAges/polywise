import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, PencilLine, Trash2 } from 'lucide-react'

import { Input } from '@/__shadcn__/components/ui/input'

import type { MouseEvent } from 'react'
import type { IProjectSerializedProjectItem } from '../../types'

interface IProps {
	project_item: IProjectSerializedProjectItem
	project_index: number
	selected: boolean
	renameProject: (args: { id: string; name: string }) => Promise<void>
	removeProject: (id: string) => Promise<void>
	setSelectedProject: (id: string) => void
}

const Index = (props: IProps) => {
	const { project_item, project_index, selected, renameProject, removeProject, setSelectedProject } = props
	const { attributes, listeners, transform, transition, setNodeRef, isDragging } = useSortable({
		id: project_item.id
	})
	const [is_renaming, setIsRenaming] = useState(false)
	const [rename_value, setRenameValue] = useState(project_item.name)
	const ref_input = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (is_renaming) {
			ref_input.current?.focus()
			ref_input.current?.select()
		}
	}, [is_renaming])

	useEffect(() => {
		setRenameValue(project_item.name)
	}, [project_item.name])

	const submitRename = async () => {
		const next_name = rename_value.trim()

		if (!next_name) {
			setIsRenaming(false)

			return
		}

		if (next_name !== project_item.name) {
			await renameProject({ id: project_item.id, name: next_name })
		}

		setIsRenaming(false)
	}

	const onRemove = async () => {
		const confirmed = window.confirm(`Delete project \"${project_item.name}\"?`)

		if (!confirmed) return

		await removeProject(project_item.id)
	}

	return (
		<div
			className={$cx(
				`
				flex
				items-center
				gap-2
				px-2 py-1
				rounded
				text-sm
				border border-border-light
			`,
				selected && 'active',
				isDragging && 'opacity-60'
			)}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			data-project-index={project_index}
			onClick={() => {
				if (!is_renaming) {
					setSelectedProject(project_item.id)
				}
			}}
		>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					text-left
				'
			>
				{is_renaming ? (
					<Input
						className='
							h-auto
							p-0
							bg-transparent
							border-none
							ring-0!
						'
						value={rename_value}
						onChange={event => setRenameValue(event.target.value)}
						onBlur={submitRename}
						onKeyDown={event => {
							if (event.key === 'Enter') {
								event.preventDefault()
								submitRename()
							}

							if (event.key === 'Escape') {
								event.preventDefault()
								setIsRenaming(false)
								setRenameValue(project_item.name)
							}
						}}
						ref={ref_input}
					></Input>
				) : (
					<>
						<div className='truncate font-medium'>{project_item.name}</div>
						<div className='text-std-400 truncate text-xs'>{project_item.dir}</div>
					</>
				)}
			</div>
			<button
				type='button'
				className='icon_button small'
				{...attributes}
				{...listeners}
				onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
			>
				<GripVertical></GripVertical>
			</button>
			{!is_renaming && (
				<>
					<button
						type='button'
						className='icon_button small'
						onClick={(event: MouseEvent<HTMLButtonElement>) => {
							event.stopPropagation()
							setIsRenaming(true)
						}}
					>
						<PencilLine></PencilLine>
					</button>
					<button
						type='button'
						className='icon_button small'
						onClick={(event: MouseEvent<HTMLButtonElement>) => {
							event.stopPropagation()
							onRemove()
						}}
					>
						<Trash2></Trash2>
					</button>
				</>
			)}
		</div>
	)
}

export default $app.memo(Index)

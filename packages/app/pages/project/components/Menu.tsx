import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'
import { FolderPlus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { Tooltip } from '@/components'

import { useModel } from '../context'
import MenuItem from './MenuItem'
import MenuProjectMenu from './MenuProjectMenu'
import MenuSessionMenu from './MenuSessionMenu'

import type { DragEndEvent } from '@dnd-kit/core'
import type { MouseEvent } from 'react'

interface IMenuTarget {
	project_index: number
	session_index: number
	id: string
}

const Index = () => {
	const { projects, selected_project_id, rename_project_id, expand_project_ids, onToggleAddModal, sortProject } =
		useModel()
	const [menu_target, setMenuTarget] = useState<IMenuTarget | null>(null)
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const findMenuTarget = useMemoizedFn((target: EventTarget | null) => {
		let current_node = target instanceof HTMLElement ? target : null

		while (current_node) {
			const project_index = current_node.getAttribute('data-project-index')
			const session_index = current_node.getAttribute('data-session-index')
			const id = current_node.getAttribute('data-id')

			if (project_index !== null && session_index !== null && id !== null) {
				const next_project_index = Number(project_index)
				const next_session_index = Number(session_index)

				if (Number.isNaN(next_project_index) || Number.isNaN(next_session_index)) {
					return null
				}

				return {
					project_index: next_project_index,
					session_index: next_session_index,
					id
				}
			}

			current_node = current_node.parentElement
		}

		return null
	})

	const onMenuContextCapture = useMemoizedFn((event: MouseEvent<HTMLDivElement>) => {
		const next_target = findMenuTarget(event.target)

		if (!next_target) {
			setMenuTarget(null)
			event.preventDefault()

			return
		}

		setMenuTarget(next_target)
	})

	const onDragProjectEnd = useMemoizedFn((args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = projects.findIndex(item => item.project.id === active.id)
		const to = projects.findIndex(item => item.project.id === over.id)

		if (from < 0 || to < 0) return

		sortProject(from, to)
	})

	const menu_content = useMemo(() => {
		if (!menu_target) return null

		const target_project = projects[menu_target.project_index]

		if (!target_project) {
			return null
		}

		if (menu_target.session_index < 0) {
			if (target_project.project.id !== menu_target.id) {
				return null
			}

			return <MenuProjectMenu projectItem={target_project.project}></MenuProjectMenu>
		}

		const target_session = target_project.sessions[menu_target.session_index]

		if (!target_session || target_session.id !== menu_target.id) {
			return null
		}

		return (
			<MenuSessionMenu projectId={target_project.project.id} sessionItem={target_session}></MenuSessionMenu>
		)
	}, [menu_target, projects])

	return (
		<div
			className='
				overflow-y-hidden
				flex flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-8
					px-3
					border-b border-border-light
				'
			>
				<span
					className='
						px-1 py-0.5
						text-xsm text-std-500 font-medium
					'
				>
					Projects
				</span>
				<div className='mr-[-2px] flex gap-1'>
					<Tooltip title='New Project'>
						<div className='icon_button small' onClick={onToggleAddModal}>
							<FolderPlus></FolderPlus>
						</div>
					</Tooltip>
				</div>
			</div>
			<ContextMenu>
				<ContextMenuTrigger className='flex min-h-0 w-full flex-1'>
					<div
						className='flex min-h-0 flex-1 overflow-y-scroll'
						onContextMenuCapture={onMenuContextCapture}
					>
						<div
							className='
								flex flex-col
								w-full
								gap-1
								px-1.5
								pb-3
							'
						>
							<DndContext sensors={sensors} onDragEnd={onDragProjectEnd}>
								<SortableContext
									items={projects.map(item => item.project.id)}
									strategy={verticalListSortingStrategy}
								>
									{projects.map((item, index) => (
										<MenuItem
											item={item}
											index={index}
											renaming={rename_project_id === item.project.id}
											selected={selected_project_id === item.project.id}
											expand={expand_project_ids.includes(item.project.id)}
											key={item.project.id}
										></MenuItem>
									))}
								</SortableContext>
							</DndContext>
						</div>
					</div>
				</ContextMenuTrigger>
				{menu_content}
			</ContextMenu>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

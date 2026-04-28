import { useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Plus } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { Tooltip } from '@/components'

import { useModel } from '../context'
import MenuItem from './MenuItem'
import MenuProjectMenu from './MenuProjectMenu'
import MenuSessionMenu from './MenuSessionMenu'

import type { MouseEvent } from 'react'
import type { IPropsMenu } from '../types'

interface IMenuTarget {
	project_index: number
	session_index: number
	id: string
}

const Index = (props: IPropsMenu) => {
	const { projects } = props
	const { createSession } = useModel()
	const [menu_target, setMenuTarget] = useState<IMenuTarget | null>(null)

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

			return <MenuProjectMenu project_item={target_project.project}></MenuProjectMenu>
		}

		const target_session = target_project.sessions[menu_target.session_index]

		if (!target_session || target_session.id !== menu_target.id) {
			return null
		}

		return (
			<MenuSessionMenu
				project_id={target_project.project.id}
				session_item={target_session}
			></MenuSessionMenu>
		)
	}, [menu_target, projects])

	return (
		<div
			className='
				overflow-y-hidden
				flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<div
				className='
					flex
					items-center justify-between
					px-3 py-1.5
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
				<div className='flex gap-1'>
					<Tooltip title='New Session'>
						<div
							className='icon_button small'
							onClick={() => createSession({ project_id: '' })}
						>
							<Plus></Plus>
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
						<div className='flex w-full flex-col px-1.5'>
							{projects.map((item, index) => (
								<MenuItem item={item} index={index} key={item.project.id}></MenuItem>
							))}
						</div>
					</div>
				</ContextMenuTrigger>
				{menu_content}
			</ContextMenu>
		</div>
	)
}

export default $app.memo(Index)

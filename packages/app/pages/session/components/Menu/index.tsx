import { useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { FolderPlus, Plus } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { Tooltip } from '@/components'
import { useDelegate } from '@/hooks'

import { useModel } from '../../context'
import { Groups, Sessions } from './components'
import CardMenu from './components/Groups/CardMenu'
import RowMenu from './components/Groups/RowMenu'
import ItemMenu from './components/Sessions/ItemMenu'

import type { MouseEvent } from 'react'
import type { IPropsGroups, IPropsMenu, IPropsSessions } from '../../types'

interface IMenuTarget {
	group_index: number
	session_index: number
	id: string
}

const Index = (props: IPropsMenu) => {
	const {
		current_tab,
		groups,
		sessions,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_index,
		rename_value,
		has_more,
		loading,
		loading_more
	} = props
	const { setCurrentTab, createSession, createGroup } = useModel()
	const [menu_target, setMenuTarget] = useState<IMenuTarget | null>(null)

	const props_groups: IPropsGroups = {
		groups,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_index,
		rename_value
	}

	const props_sessions: IPropsSessions = {
		groups,
		sessions,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_index,
		rename_value,
		has_more,
		loading,
		loading_more
	}

	const ref_tab = useDelegate(v => setCurrentTab(v), { item_type: 'span' })

	const ref_action = useDelegate(v => {
		setCurrentTab(v)

		if (v === 'group') {
			createGroup()
		} else {
			createSession()
		}
	})

	const findMenuTarget = useMemoizedFn((target: EventTarget | null) => {
		let current_node = target instanceof HTMLElement ? target : null

		while (current_node) {
			const group_index = current_node.getAttribute('data-group-index')
			const session_index = current_node.getAttribute('data-session-index')
			const id = current_node.getAttribute('data-id')

			if (group_index !== null && session_index !== null && id !== null) {
				const next_group_index = Number(group_index)
				const next_session_index = Number(session_index)

				if (Number.isNaN(next_group_index) || Number.isNaN(next_session_index)) {
					return null
				}

				return {
					group_index: next_group_index,
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
		if (!menu_target) return

		if (menu_target.group_index >= 0 && menu_target.session_index < 0) {
			const target_group = groups[menu_target.group_index]

			if (target_group) {
				return (
					<CardMenu
						group_index={menu_target.group_index}
						groups_count={groups.length}
						group_name={target_group.group}
					></CardMenu>
				)
			}
		} else if (menu_target.group_index >= 0 && menu_target.session_index >= 0) {
			const target_group = groups[menu_target.group_index]
			const target_session = target_group?.items[menu_target.session_index]

			if (target_session && target_session.id === menu_target.id) {
				return (
					<RowMenu
						group_index={menu_target.group_index}
						session_index={menu_target.session_index}
						group_items_count={target_group.items.length}
						item={target_session}
						groups={groups}
						pin={target_session.id in pin_map}
					></RowMenu>
				)
			}
		} else if (menu_target.group_index < 0 && menu_target.session_index >= 0) {
			const target_session = sessions[menu_target.session_index]

			if (target_session && target_session.id === menu_target.id) {
				return (
					<ItemMenu
						item={target_session}
						groups={groups}
						pin={target_session.id in pin_map}
						session_index={menu_target.session_index}
					></ItemMenu>
				)
			}
		}
	}, [menu_target])

	return (
		<div
			className='
				overflow-hidden
				flex flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<div
				className='
					flex
					items-center justify-between
					px-3 py-1.5
					border-b border-border-light
				'
			>
				<div
					className='
						flex
						items-center
						gap-0.5
						text-xsm text-std-400 font-medium
					'
					ref={ref_tab}
				>
					<span
						className={$cx('clickable px-1 py-0.5', current_tab === 'group' && 'text-std-800')}
						data-key='group'
					>
						Group
					</span>
					<span
						className={$cx(
							'clickable px-1 py-0.5',
							current_tab === 'session' && 'text-std-800'
						)}
						data-key='session'
					>
						Session
					</span>
				</div>
				<div className='flex gap-1' ref={ref_action}>
					<Tooltip title='New Group'>
						<div className='icon_button small' data-key='group'>
							<FolderPlus></FolderPlus>
						</div>
					</Tooltip>
					<Tooltip title='New Session'>
						<div className='icon_button small' data-key='session'>
							<Plus></Plus>
						</div>
					</Tooltip>
				</div>
			</div>
			<ContextMenu>
				<ContextMenuTrigger className='flex min-h-0 w-full flex-1'>
					<div className='flex h-full w-full' onContextMenuCapture={onMenuContextCapture}>
						{current_tab === 'session' ? (
							<Sessions {...props_sessions}></Sessions>
						) : (
							<Groups {...props_groups}></Groups>
						)}
					</div>
				</ContextMenuTrigger>
				{menu_content}
			</ContextMenu>
		</div>
	)
}

export default $app.memo(Index)

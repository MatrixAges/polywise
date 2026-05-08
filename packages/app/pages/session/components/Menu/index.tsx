import { useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { FolderPlus, Plus } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { TextTabs, Tooltip } from '@/components'
import { useDelegate } from '@/hooks'

import { useModel } from '../../context'
import { Groups, Sessions } from './components'
import CardMenu from './components/Groups/CardMenu'
import RowMenu from './components/Groups/RowMenu'
import ItemMenu from './components/Sessions/ItemMenu'

import type { MouseEvent } from 'react'
import type { IPropsGroups, IPropsMenu, IPropsSessions } from '../../types'

interface IMenuTarget {
	groupIndex: number
	sessionIndex: number
	id: string
}

const Index = (props: IPropsMenu) => {
	const {
		currentTab,
		groups,
		sessions,
		pinMap,
		selectedSessionId,
		renameGroupIndex,
		renameSessionIndex,
		renameValue,
		hasMore,
		loading,
		loadingMore
	} = props
	const { setCurrentTab, createSession, createGroup } = useModel()
	const [menu_target, setMenuTarget] = useState<IMenuTarget | null>(null)

	const props_groups: IPropsGroups = {
		groups,
		pinMap,
		selectedSessionId,
		renameGroupIndex,
		renameSessionIndex,
		renameValue
	}

	const props_sessions: IPropsSessions = {
		groups,
		sessions,
		pinMap,
		selectedSessionId,
		renameGroupIndex,
		renameSessionIndex,
		renameValue,
		hasMore,
		loading,
		loadingMore
	}

	const ref_action = useDelegate(v => {
		setCurrentTab(v)

		if (v === 'groups') {
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
					groupIndex: next_group_index,
					sessionIndex: next_session_index,
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

		if (menu_target.groupIndex >= 0 && menu_target.sessionIndex < 0) {
			const target_group = groups[menu_target.groupIndex]

			if (target_group) {
				return (
					<CardMenu
						groupIndex={menu_target.groupIndex}
						groupsCount={groups.length}
						groupName={target_group.group}
					></CardMenu>
				)
			}
		} else if (menu_target.groupIndex >= 0 && menu_target.sessionIndex >= 0) {
			const target_group = groups[menu_target.groupIndex]
			const target_session = target_group?.items[menu_target.sessionIndex]

			if (target_session && target_session.id === menu_target.id) {
				return (
					<RowMenu
						groupIndex={menu_target.groupIndex}
						sessionIndex={menu_target.sessionIndex}
						groupItemsCount={target_group.items.length}
						item={target_session}
						groups={groups}
						pin={target_session.id in pinMap}
					></RowMenu>
				)
			}
		} else if (menu_target.groupIndex < 0 && menu_target.sessionIndex >= 0) {
			const target_session = sessions[menu_target.sessionIndex]

			if (target_session && target_session.id === menu_target.id) {
				return (
					<ItemMenu
						item={target_session}
						groups={groups}
						pin={target_session.id in pinMap}
						sessionIndex={menu_target.sessionIndex}
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
					h-8
					px-3
					border-b border-border-light
				'
			>
				<TextTabs
					items={['groups', 'sessions']}
					active={currentTab}
					setActive={setCurrentTab}
				></TextTabs>
				<div className='flex gap-1' ref={ref_action}>
					<Tooltip title='New Group'>
						<div className='icon_button small' data-key='groups'>
							<FolderPlus></FolderPlus>
						</div>
					</Tooltip>
					<Tooltip title='New Session'>
						<div className='icon_button small' data-key='sessions'>
							<Plus></Plus>
						</div>
					</Tooltip>
				</div>
			</div>
			<ContextMenu>
				<ContextMenuTrigger className='flex min-h-0 w-full flex-1'>
					<div className='flex h-full w-full' onContextMenuCapture={onMenuContextCapture}>
						{currentTab === 'sessions' ? (
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

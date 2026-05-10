import { useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Plus } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { Tooltip } from '@/components'

import { useModel } from '../../context'
import { Sessions } from './components'
import ItemMenu from './components/Sessions/ItemMenu'

import type { MouseEvent } from 'react'
import type { IPropsMenu, IPropsSessions } from '../../types'

interface IMenuTarget {
	pin: boolean
	sessionIndex: number
	id: string
}

const Index = (props: IPropsMenu) => {
	const {
		pins,
		sessions,
		selectedSessionId,
		renamePin,
		renameSessionIndex,
		renameValue,
		hasMore,
		loading,
		loadingMore
	} = props
	const { createSession } = useModel()
	const [menu_target, setMenuTarget] = useState<IMenuTarget | null>(null)

	const props_sessions: IPropsSessions = {
		pins,
		sessions,
		selectedSessionId,
		renamePin,
		renameSessionIndex,
		renameValue,
		hasMore,
		loading,
		loadingMore
	}

	const findMenuTarget = useMemoizedFn((target: EventTarget | null) => {
		let current_node = target instanceof HTMLElement ? target : null

		while (current_node) {
			const pin = current_node.getAttribute('data-pin')
			const session_index = current_node.getAttribute('data-session-index')
			const id = current_node.getAttribute('data-id')

			if (pin !== null && session_index !== null && id !== null) {
				const next_session_index = Number(session_index)

				if (Number.isNaN(next_session_index)) {
					return null
				}

				return {
					pin: pin === 'true',
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

		const target_session = menu_target.pin ? pins[menu_target.sessionIndex] : sessions[menu_target.sessionIndex]

		if (target_session && target_session.id === menu_target.id) {
			return (
				<ItemMenu
					item={target_session}
					pin={menu_target.pin}
					sessionIndex={menu_target.sessionIndex}
				></ItemMenu>
			)
		}
	}, [menu_target, pins, sessions])

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
				<span className='text-xsm text-std-500 font-medium'>Sessions</span>
				<Tooltip title='New Session'>
					<div className='icon_button small -mr-1' onClick={() => createSession()}>
						<Plus></Plus>
					</div>
				</Tooltip>
			</div>
			<ContextMenu>
				<ContextMenuTrigger className='flex min-h-0 w-full flex-1'>
					<div className='flex h-full w-full' onContextMenuCapture={onMenuContextCapture}>
						<Sessions {...props_sessions}></Sessions>
					</div>
				</ContextMenuTrigger>
				{menu_content}
			</ContextMenu>
		</div>
	)
}

export default $app.memo(Index)

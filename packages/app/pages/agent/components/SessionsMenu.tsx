import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'
import { MessageCircleCheck, PanelLeftClose, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { useModel } from '../context'
import PinMenuItem from './PinMenuItem'
import SessionItemMenu from './SessionItemMenu'
import SessionMenuItem from './SessionMenuItem'

import type { DragEndEvent } from '@dnd-kit/core'
import type { MouseEvent, UIEvent } from 'react'

interface IMenuTarget {
	pin: boolean
	sessionIndex: number
	id: string
}

const Index = () => {
	const {
		pins,
		session_items,
		pin_map,
		selected_session_id,
		rename_session_id,
		rename_value,
		session_loading,
		session_loading_more,
		session_initialized,
		session_has_more,
		setSessionMenuOpen,
		createSession,
		loadMoreSessions,
		sortPin
	} = useModel()
	const [menu_target, setMenuTarget] = useState<IMenuTarget | null>(null)
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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

	const onDragEnd = useMemoizedFn((args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = pins.findIndex(item => item.id === active.id)
		const to = pins.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		sortPin(from, to)
	})

	const onScroll = useMemoizedFn((event: UIEvent<HTMLDivElement>) => {
		const target = event.currentTarget
		const is_near_bottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24

		if (is_near_bottom) {
			void loadMoreSessions()
		}
	})

	const menu_content = useMemo(() => {
		if (!menu_target) return null

		const target_session = menu_target.pin
			? pins[menu_target.sessionIndex]
			: session_items[menu_target.sessionIndex]

		if (target_session && target_session.id === menu_target.id) {
			return <SessionItemMenu item={target_session} pin={menu_target.pin}></SessionItemMenu>
		}

		return null
	}, [menu_target, pins, session_items])

	return (
		<div
			className='
				overflow-hidden
				flex flex-col shrink-0
				w-[210px] h-full
				border-r border-border-light
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-9
					px-1.5
				'
			>
				<div className='flex items-center gap-1 pl-1'>
					<MessageCircleCheck size={11}></MessageCircleCheck>
					<span className='text-xs font-medium'>Sessions</span>
				</div>
				<div className='flex gap-1'>
					<button
						className='icon_button small'
						type='button'
						onClick={() => setSessionMenuOpen(false)}
					>
						<PanelLeftClose className='size-3'></PanelLeftClose>
					</button>
					<button className='icon_button small' type='button' onClick={createSession}>
						<Plus className='size-3.5'></Plus>
					</button>
				</div>
			</div>
			<div className='min-h-0 flex-1'>
				<ContextMenu>
					<ContextMenuTrigger
						className='
							flex flex-1
							w-full h-full
							min-h-0
						'
					>
						<div className='flex h-full w-full' onContextMenuCapture={onMenuContextCapture}>
							<div
								className='
									overflow-y-auto
									w-full h-full
									px-1.5
								'
								onScroll={onScroll}
							>
								<div
									className='
										flex flex-col
										gap-1
										pb-3
									'
								>
									{pins.length > 0 && (
										<>
											<DndContext sensors={sensors} onDragEnd={onDragEnd}>
												<SortableContext
													items={pins.map(item => item.id)}
													strategy={verticalListSortingStrategy}
												>
													{pins.map((item, session_index) => {
														const selected =
															selected_session_id ===
															item.id
														const renaming =
															rename_session_id === item.id

														return (
															<PinMenuItem
																item={item}
																pin
																session_index={
																	session_index
																}
																selected={selected}
																renaming={renaming}
																rename_value={
																	renaming
																		? rename_value
																		: ''
																}
																key={item.id}
															></PinMenuItem>
														)
													})}
												</SortableContext>
											</DndContext>
											<div className='border-border-light my-1 border-b'></div>
										</>
									)}
									{session_items.map((item, session_index) => {
										const selected = selected_session_id === item.id
										const renaming = rename_session_id === item.id

										return (
											<SessionMenuItem
												item={item}
												pin={Boolean(pin_map[item.id])}
												session_index={session_index}
												selected={selected}
												renaming={renaming}
												rename_value={renaming ? rename_value : ''}
												key={item.id}
											></SessionMenuItem>
										)
									})}
									{!session_initialized &&
									(session_loading || session_loading_more) &&
									!session_items.length &&
									!pins.length ? (
										<div
											className='
												flex
												items-center
												px-3 py-4
												text-xs text-std-400
											'
										>
											<Spinner className='size-3.5'></Spinner>
										</div>
									) : null}
									{session_has_more && (
										<button
											type='button'
											className='
												px-3 py-1.5
												text-xsm text-std-400
												text-left
												disabled:cursor-not-allowed disabled:opacity-50
												hover:text-std-800
												clickit
											'
											onClick={() => loadMoreSessions()}
											disabled={session_loading || session_loading_more}
										>
											{session_loading_more ? 'Loading...' : 'Show more'}
										</button>
									)}
								</div>
							</div>
						</div>
					</ContextMenuTrigger>
					{menu_content}
				</ContextMenu>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

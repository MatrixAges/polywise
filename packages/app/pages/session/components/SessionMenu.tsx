import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'
import PinMenuItem from './PinMenuItem'
import SessionItemMenu from './SessionItemMenu'
import SessionMenuItem from './SessionMenuItem'

import type { DragEndEvent } from '@dnd-kit/core'
import type { MouseEvent } from 'react'

interface IMenuTarget {
	pin: boolean
	sessionIndex: number
	id: string
}

const Index = () => {
	const {
		pins,
		sessions,
		selected_session_id,
		rename_session_id,
		rename_value,
		loading,
		loading_more,
		has_more,
		onScroll,
		loadMore,
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

	const menu_content = useMemo(() => {
		if (!menu_target) return null

		const target_session = menu_target.pin ? pins[menu_target.sessionIndex] : sessions[menu_target.sessionIndex]

		if (target_session && target_session.id === menu_target.id) {
			return <SessionItemMenu item={target_session} pin={menu_target.pin}></SessionItemMenu>
		}

		return null
	}, [menu_target, pins, sessions])

	return (
		<div
			className='
				flex flex-col
				w-full
			'
		>
			<ContextMenu>
				<ContextMenuTrigger className='flex min-h-0 w-full flex-1'>
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
										<div
											className='
												px-2.5 pt-1
												text-[11px] text-std-400 font-medium
												tracking-wide
												uppercase
											'
										>
											Pinned
										</div>
										<DndContext sensors={sensors} onDragEnd={onDragEnd}>
											<SortableContext
												items={pins.map(item => item.id)}
												strategy={verticalListSortingStrategy}
											>
												{pins.map((item, session_index) => {
													const selected =
														selected_session_id === item.id
													const renaming =
														rename_session_id === item.id

													return (
														<PinMenuItem
															item={item}
															pin
															session_index={session_index}
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
								{sessions.map((item, session_index) => {
									const selected = selected_session_id === item.id
									const renaming = rename_session_id === item.id

									return (
										<SessionMenuItem
											item={item}
											pin={false}
											session_index={session_index}
											selected={selected}
											renaming={renaming}
											rename_value={renaming ? rename_value : ''}
											key={item.id}
										></SessionMenuItem>
									)
								})}
								{has_more && (
									<button
										type='button'
										className='
											px-2.5 py-1
											text-xsm text-std-400
											text-left
											disabled:cursor-not-allowed disabled:opacity-50
											hover:text-std-800
											clickit
										'
										onClick={() => loadMore()}
										disabled={loading || loading_more}
									>
										{loading || loading_more ? 'Loading...' : 'Show more'}
									</button>
								)}
							</div>
						</div>
					</div>
				</ContextMenuTrigger>
				{menu_content}
			</ContextMenu>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

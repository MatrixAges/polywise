import { Fragment, useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Drawer } from '@/components'
import { useAliveEffect } from '@/hooks'
import Logo from '@/public/bare.svg?react'

import { Context, Input, LoadingDots, Message, Permission } from './components'
import Model from './model'

import type { IPropsInput } from './types'

export interface IProps {
	type: 'page' | 'global'
	id: string
	input?: string
	create?: (input: string) => void
}

const Index = (props: IProps) => {
	const { type, id, input, create } = props
	const [x] = useState(() => container.resolve(Model))

	const streaming = x.status === 'streaming' || x.status === 'submitted'
	const last_message = x.messages.at(-1)
	const is_page = type === 'page'

	const { ref, setRef } = useAliveEffect({
		init: () => x.init({ id, input }),
		deinit: () => x.deinit(),
		deps: [id],
		normal: is_page
	})

	const setConfainerRef = useMemoizedFn(v => (x.ref_container = v))
	const setBottomSignalRef = useMemoizedFn(v => (x.ref_bottom_signal = v))
	const toggleContextModal = useMemoizedFn(() => (x.open_context_modal = !x.open_context_modal))

	const props_input: IPropsInput = {
		is_page,
		streaming,
		archived: x.archived_at !== null,
		send: useMemoizedFn((v: string) => {
			if (create) {
				create(v)
			} else {
				x.send(v)
			}
		}),
		stop: x.stop,
		clear: x.clear,
		archive: x.archive,
		unarchive: x.unarchive,
		scrollToBottom: x.scrollToBottom,
		toggleContextModal
	}

	const show_loading = useMemo(() => streaming && last_message?.role === 'user', [streaming, last_message])
	const empty = x.messages.length === 0

	return (
		<div
			className='
				relative
				overflow-hidden
				flex flex-col
				items-center
				w-full h-full
			'
			ref={setRef}
		>
			{is_page && (
				<div
					className='
						flex
						items-center justify-between
						w-full h-8
						px-3
						text-xsm
					'
				>
					<span className='text-std-400 font-medium'>{x.session.title}</span>
				</div>
			)}
			<div
				className={$cx(
					`
					overflow-y-scroll
					flex flex-1 flex-col
					w-full
					gap-4
					p-4
				`,
					!x.inited && 'justify-end',
					x.signal,
					empty && 'items-center justify-center!'
				)}
				onWheel={x.onWheel}
				onScroll={x.onScroll}
				ref={setConfainerRef}
			>
				{empty ? (
					<div
						className='
							flex flex-col
							items-center justify-center
							gap-3
							text-std-200 text-sm
							fill-std-200 -mb-12
						'
					>
						<div
							className='
								flex
								p-1.5
								rounded-lg
								border border-border-light
							'
							style={{ width: 48, height: 48 }}
						>
							<Logo width='100%' height='100%'></Logo>
						</div>
						<span className='font-medium'>New Beginning</span>
					</div>
				) : (
					<Fragment>
						<div
							className={$cx(
								`
								flex flex-col
								w-full
								gap-6
							`,
								is_page && 'page_wrap py-0'
							)}
						>
							{x.messages.map((message, index) => (
								<Message
									streaming={index === x.messages.length - 1 && streaming}
									message={message}
									answer={x.answer}
									key={message.id}
								></Message>
							))}
							{show_loading && <LoadingDots></LoadingDots>}
						</div>
						{x.permission && (
							<Permission
								permission={x.permission}
								approvePermission={x.approvePermission}
							></Permission>
						)}
						<div className='mt-12 h-8' ref={setBottomSignalRef}></div>
					</Fragment>
				)}
			</div>
			<Input {...props_input}></Input>
			<Drawer
				class_name='p-3'
				content_class_name='rounded-lg'
				placement='bottom'
				getContainer={() => ref}
				mask_closable
				height='100%'
				width={is_page ? 480 : '100%'}
				title='Session Context'
				desc='Current session state and env'
				open={x.open_context_modal}
				onClose={toggleContextModal}
			>
				<Context {...x.context}></Context>
			</Drawer>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

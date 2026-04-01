import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle
} from '@/__shadcn__/components/ui/drawer'
import { useAliveEffect } from '@/hooks'

import { Input, Message } from './components'
import Model from './model'

import type { IPropsInput } from './types'

interface IProps {
	id: string
}

const Index = (props: IProps) => {
	const { id } = props
	const [x] = useState(() => container.resolve(Model))

	const streaming = x.status === 'streaming'

	const { ref, setRef } = useAliveEffect({
		init: () => x.init(id),
		deinit: () => x.deinit()
	})

	const setConfainerRef = useMemoizedFn(v => (x.ref_container = v))
	const setBottomSignalRef = useMemoizedFn(v => (x.ref_bottom_signal = v))
	const toggleContextModal = useMemoizedFn(() => (x.open_context_modal = !x.open_context_modal))

	const props_input: IPropsInput = {
		streaming,
		send: x.send,
		stop: x.stop,
		clear: x.clear,
		scrollToBottom: x.scrollToBottom,
		toggleContextModal
	}

	return (
		<div
			className='
				relative
				overflow-hidden
				flex flex-col
				w-full h-full
			'
			ref={setRef}
		>
			<div
				className={$cx(
					`
					overflow-y-scroll
					flex flex-1 flex-col
					gap-4
					p-4
				`,
					x.chat_signal
				)}
				onWheel={x.onWheel}
				onScroll={x.onScroll}
				ref={setConfainerRef}
			>
				<div
					className='
						flex flex-col
						w-full
						gap-6
					'
				>
					{x.messages.map((message, index) => (
						<Message
							streaming={index === x.messages.length - 1 && streaming}
							message={message}
							key={message.id}
						></Message>
					))}
					<div className='mt-12 h-8' ref={setBottomSignalRef}></div>
				</div>
			</div>
			<Input {...props_input}></Input>
			<Drawer direction='bottom' container={ref} open={x.open_context_modal}>
				<DrawerContent className='absolute top-0' overlayClassName='absolute top-0'>
					<DrawerHeader>
						<DrawerTitle>Are you absolutely sure?</DrawerTitle>
						<DrawerDescription>This action cannot be undone.</DrawerDescription>
					</DrawerHeader>
					<DrawerFooter>
						<Button>Submit</Button>
						<Button variant='outline' onClick={toggleContextModal}>
							Cancel
						</Button>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

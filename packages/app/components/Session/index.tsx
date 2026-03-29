import { useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Message, MessageContent, MessageResponse } from '@/__shadcn__/components/ai-elements'
import { useAliveEffect } from '@/hooks'

import { Input, LoadingDots } from './components'
import Model from './model'

import type { IPropsInput } from './types'

interface IProps {
	id: string
}

const Index = (props: IProps) => {
	const { id } = props
	const [x] = useState(() => container.resolve(Model))

	const streaming = x.status === 'streaming'

	const { setRef } = useAliveEffect({
		init: () => x.init(id),
		deinit: () => x.deinit()
	})

	const setConfainerRef = useMemoizedFn(v => (x.ref_container = v))

	const props_input: IPropsInput = {
		streaming,
		send: x.send,
		stop: x.stop,
		clear: x.clear
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
				ref={setConfainerRef}
			>
				<div
					className='
						flex flex-col
						w-full
						gap-6
						pb-20
					'
				>
					{x.messages.map(message => (
						<Message from={message.role} key={message.id}>
							<MessageContent>
								{message.parts.length ? (
									message.parts
										.filter(part => part.type === 'text')
										.map((part, i) => (
											<MessageResponse
												isAnimating={
													streaming && message.role === 'assistant'
												}
												key={`${message.id}-${i}`}
											>
												{part.text}
											</MessageResponse>
										))
								) : (
									<LoadingDots></LoadingDots>
								)}
							</MessageContent>
						</Message>
					))}
				</div>
			</div>
			<Input {...props_input}></Input>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

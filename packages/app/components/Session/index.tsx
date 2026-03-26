import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Message, MessageContent, MessageResponse } from '@/__shadcn__/components/ai-elements'
import { useAliveEffect } from '@/hooks'

import { Input } from './components'
import Model from './model'

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

	return (
		<div className='flex h-full w-full flex-col' ref={setRef}>
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
			>
				<div className='flex w-full flex-col'>
					{x.messages.map(message => (
						<Message from={message.role} key={message.id}>
							<MessageContent>
								{message.parts
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
									))}
							</MessageContent>
						</Message>
					))}
				</div>
			</div>
			<Input></Input>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

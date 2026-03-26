import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import {
	Message,
	MessageContent,
	MessageResponse,
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea
} from '@/__shadcn__/components/ai-elements'
import { useAliveEffect } from '@/hooks'

import Model from './model'

import type { PromptInputMessage } from '@/__shadcn__/components/ai-elements/prompt-input'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const [input, setInput] = useState('')

	const streaming = x.status === 'streaming'

	const { setRef } = useAliveEffect({
		init: () => x.init('global_panel_session'),
		deinit: () => x.deinit()
	})

	const handleSubmit = useMemoizedFn((message: PromptInputMessage) => {
		if (message.text?.trim()) {
			x.send(message.text)
			setInput('')
		}
	})

	const handleStop = useMemoizedFn(() => {
		x.stop()
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
				{x.messages.map(message => (
					<Message from={message.role} key={message.id}>
						<MessageContent>
							{message.parts
								.filter(part => part.type === 'text')
								.map((part, i) => (
									<MessageResponse
										isAnimating={streaming && message.role === 'assistant'}
										key={`${message.id}-${i}`}
									>
										{part.text}
									</MessageResponse>
								))}
						</MessageContent>
					</Message>
				))}
			</div>

			<div className='border-border-light w-full border-t p-3'>
				<PromptInput onSubmit={handleSubmit} className='w-full'>
					<PromptInputTextarea
						value={input}
						placeholder='输入消息...'
						onChange={e => setInput(e.currentTarget.value)}
					/>
					<PromptInputSubmit status={streaming ? 'streaming' : 'ready'} onStop={handleStop} />
				</PromptInput>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

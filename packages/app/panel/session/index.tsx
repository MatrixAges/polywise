import { useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useAliveEffect } from '@/hooks'

import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const textarea = useRef<HTMLTextAreaElement>(null)

	const streaming = x.status === 'streaming'

	const { setRef } = useAliveEffect({
		init: () => x.init('global_panel_session'),
		deinit: () => x.deinit()
	})

	const submit = useMemoizedFn(() => {
		x.send(textarea.current?.value!)
	})

	return (
		<div className='flex h-full w-full flex-col' ref={setRef}>
			<div
				className={$cx(
					`
					overflow-y-scroll
					flex flex-1
					wrap-anywhere
					w-full
				`,
					x.chat_signal
				)}
			>
				{JSON.stringify(x.messages)}
			</div>
			<div className='border-border-light w-full border-t'>
				<textarea className='w-full resize-none px-3 py-2' ref={textarea} />
				<button className='click_button' onClick={submit}>
					submit
				</button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

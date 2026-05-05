import { Fragment, useLayoutEffect, useState } from 'react'
import { CircleAlert, Loader, MessageSquareDot } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import Model from './model'
import SessionDialog from './SessionDialog'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const { unread = 0, running = 0, error = 0 } = x.count

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [x])

	if (!unread && !running && !error) return null

	return (
		<Fragment>
			<div
				className='
					flex
					items-center
					gap-1.5
					text-xs text-std-400 font-mono leading-0
				'
				onClick={x.toggleOpen}
			>
				{unread > 0 && (
					<div
						className='
							flex
							items-center
							gap-1
							px-1 py-0.5
							rounded-full
							bg-mauve-400/20
						'
					>
						<MessageSquareDot className='size-3'></MessageSquareDot>
						<span>{unread}</span>
					</div>
				)}
				{running > 0 && (
					<div
						className='
							flex
							items-center
							gap-1
							px-1 py-0.5
							rounded-full
						'
					>
						<Loader className='size-3'></Loader>
						<span>{running}</span>
					</div>
				)}
				{error > 0 && (
					<div
						className='
							flex
							items-center
							gap-1
							px-1 py-0.5
							rounded-full
						'
					>
						<CircleAlert className='size-3'></CircleAlert>
						<span>{error}</span>
					</div>
				)}
			</div>
			<SessionDialog x={x}></SessionDialog>
		</Fragment>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

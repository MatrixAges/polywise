import { useLayoutEffect, useState } from 'react'
import { CircleAlert, Loader, MessageSquareDot } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useDelegate } from '@/hooks'

import type Model from './model'

interface IProps {
	x: Model
}

const Index = (props: IProps) => {
	const { x } = props
	const { unread = 0, running = 0, error = 0 } = x.count

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [x])

	const state = unread || running || error

	const ref = useDelegate(
		v => {
			x.toggleOpen()
			x.setCurrentStatus(v)
		},
		{ visible: state > 0 }
	)

	if (!state) return null

	return (
		<div
			className='
				flex
				items-center
				gap-1.5
				text-xs text-std-400 font-mono leading-0
			'
			ref={ref}
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
					data-key='unread'
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
					data-key='running'
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
					data-key='error'
				>
					<CircleAlert className='size-3'></CircleAlert>
					<span>{error}</span>
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

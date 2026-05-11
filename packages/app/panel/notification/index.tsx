import { useLayoutEffect, useState } from 'react'
import { BellRing, Link2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { formatDateTime, fromNow } from '@/utils'

import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	if (x.loading) {
		return (
			<div
				className='
					flex
					w-full
					p-3
					text-sm text-std-400
				'
			>
				Loading notifications...
			</div>
		)
	}

	if (x.list.length === 0) {
		return (
			<div
				className='
					flex
					w-full
					p-3
					text-sm text-std-400
				'
			>
				No notifications.
			</div>
		)
	}

	return (
		<div
			className='
				flex flex-col
				w-full
				gap-2
				p-2
			'
		>
			{x.list.map(item => {
				const time = item.created_at ?? item.updated_at

				return (
					<div
						key={item.id}
						className='
						p-3
						rounded-xl
						bg-white/80
						border border-black/6
						dark:border-white/8 dark:bg-white/4
					'
					>
						<div className='flex items-start justify-between gap-3'>
							<div className='min-w-0 flex-1'>
								<div
									className='
									flex
									items-center
									gap-2
									text-sm font-medium
								'
								>
									<BellRing className='text-std-400 size-3.5 shrink-0' />
									<span className='truncate'>{item.title}</span>
								</div>
								{item.description && (
									<div className='text-std-500 mt-1 text-sm whitespace-pre-wrap'>
										{item.description}
									</div>
								)}
								{item.session_title && (
									<div
										className='
										flex
										items-center
										gap-1
										mt-2
										text-xs text-std-400
									'
									>
										<Link2 className='size-3 shrink-0' />
										<span className='truncate'>{item.session_title}</span>
									</div>
								)}
							</div>
							<div className='text-std-400 shrink-0 text-right text-xs'>
								<div>{time ? fromNow(time) : '--'}</div>
								<div>{time ? formatDateTime(time, 'MM-DD HH:mm') : '--'}</div>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

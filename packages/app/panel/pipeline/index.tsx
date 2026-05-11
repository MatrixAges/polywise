import { useLayoutEffect, useState } from 'react'
import { CircleAlert, LoaderCircle, Workflow } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { formatDateTime, fromNow } from '@/utils'

import Model from './model'

const status_class_map = {
	running: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
	done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
	error: 'bg-red-500/10 text-red-600 dark:text-red-300'
} as const

const status_icon_map = {
	running: <LoaderCircle className='size-3 animate-spin' />,
	done: <Workflow className='size-3' />,
	error: <CircleAlert className='size-3' />
} as const

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
				Loading pipeline tasks...
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
				No pipeline tasks.
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
				return (
					<div
						key={item.article_id}
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
								<div className='truncate text-sm font-medium'>{item.title}</div>
								<div className='text-std-400 mt-1 text-xs'>{item.article_id}</div>
							</div>
							<div
								className={`
								inline-flex
								shrink-0
								items-center
								gap-1
								px-2 py-1
								rounded-full
								text-xs font-medium
								${status_class_map[item.status]}`}
							>
								{status_icon_map[item.status]}
								<span>{item.status}</span>
							</div>
						</div>
						<div
							className='
							flex
							items-center justify-between
							gap-3
							mt-3
							text-xs text-std-400
						'
						>
							<div>{fromNow(item.created_at)}</div>
							<div>{formatDateTime(item.created_at, 'MM-DD HH:mm')}</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

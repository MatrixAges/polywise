import { useLayoutEffect, useState } from 'react'
import { CircleAlert, Clock3, Loader2, LoaderCircle, Workflow } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { container } from 'tsyringe'

import { formatDateTime, fromNow } from '@/utils'

import Model from './model'

import type { PipelineItem } from './types'

const status_class_map = {
	queued: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
	running: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
	done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
	error: 'bg-red-500/10 text-red-600 dark:text-red-300'
} as const

const status_icon_map = {
	queued: <Clock3 className='size-3' />,
	running: <LoaderCircle className='size-3 animate-spin' />,
	done: <Workflow className='size-3' />,
	error: <CircleAlert className='size-3' />
} as const

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const { t } = useTranslation('layout')

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const running_list = x.running_list
	const queued_list = x.queued_list
	const recent_list = x.recent_list
	const getStatusLabel = (item: PipelineItem) => {
		return item.status === 'running' && item.status_text ? item.status_text : item.status
	}
	const renderActions = (item: PipelineItem) => {
		const cancel_loading = x.isActionLoading({ article_id: item.article_id, action: 'cancel' })
		const retry_loading = x.isActionLoading({ article_id: item.article_id, action: 'retry' })

		if (item.status === 'running' && item.source === 'active') {
			return (
				<button
					className='
						h-6
						px-2
						text-xs
						click_button small
					'
					type='button'
					disabled={cancel_loading}
					onClick={() => void x.cancelTask(item.article_id)}
				>
					{cancel_loading ? <Loader2 className='size-3 animate-spin'></Loader2> : null}
					<span>{cancel_loading ? t('panel.cancelling') : t('panel.cancel')}</span>
				</button>
			)
		}

		if (item.status === 'error') {
			return (
				<button
					className='
						h-6
						px-2
						text-xs
						click_button small
					'
					type='button'
					disabled={retry_loading}
					onClick={() => void x.retryTask(item.article_id)}
				>
					{retry_loading ? <Loader2 className='size-3 animate-spin'></Loader2> : null}
					<span>{retry_loading ? t('panel.retrying') : t('panel.retry')}</span>
				</button>
			)
		}

		return null
	}
	const renderItem = (item: PipelineItem, time_value: string) => {
		return (
			<div
				key={item.task_key}
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
						{item.error_message ? (
							<div
								className='
									mt-2
									text-xs text-red-600
									dark:text-red-300
									line-clamp-2
								'
							>
								{item.error_message}
							</div>
						) : null}
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
						<span>{getStatusLabel(item)}</span>
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
					<div>{fromNow(time_value)}</div>
					<div className='flex shrink-0 items-center gap-2'>
						{renderActions(item)}
						<div>{formatDateTime(time_value, 'MM-DD HH:mm')}</div>
					</div>
				</div>
			</div>
		)
	}

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
				{t('panel.loading_pipeline')}
			</div>
		)
	}

	if (running_list.length === 0 && queued_list.length === 0 && recent_list.length === 0) {
		return (
			<div
				className='
					flex
					w-full
					p-3
					text-sm text-std-400
				'
			>
				{t('panel.empty_pipeline')}
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
			{running_list.length > 0 ? (
				<div className='text-std-400 px-1 text-xs font-medium'>{t('panel.running')}</div>
			) : null}
			{running_list.map(item => renderItem(item, item.created_at))}
			{queued_list.length > 0 ? (
				<div className='text-std-400 px-1 text-xs font-medium'>{t('panel.queued')}</div>
			) : null}
			{queued_list.map(item => renderItem(item, item.created_at))}
			{recent_list.length > 0 ? (
				<div
					className='
						px-1
						mt-2
						text-xs text-std-400 font-medium
					'
				>
					{t('panel.recent')}
				</div>
			) : null}
			{recent_list.map(item => {
				const time_value = item.done_at || item.created_at

				return renderItem(item, time_value)
			})}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

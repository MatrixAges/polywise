import dayjs from 'dayjs'
import { Bot, Globe, Loader, RefreshCw, TimerReset } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { MessageResponse } from '@/__shadcn__/components/ai-elements/message'
import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'
import { getLinkFaviconSrc } from '../types'

const Index = () => {
	const x = useModel()
	const item = x.selected_item
	const favicon_src = getLinkFaviconSrc(item?.favicon)
	const has_content = Boolean(x.detail?.article?.content?.trim())
	const toolbar_status = x.batch_status_text

	return (
		<div className='flex min-w-0 flex-1 flex-col'>
			<div
				className='
					flex shrink-0
					items-center justify-between
					h-14
					gap-3
					px-5
					border-b border-border-light
				'
			>
				<div className='flex min-w-0 items-center gap-3'>
					<div
						className='
							overflow-hidden
							flex shrink-0
							items-center justify-center
							size-10
							rounded-2xl
							text-std-400
							bg-secondary
						'
					>
						{favicon_src ? (
							<img
								className='size-full object-cover'
								src={favicon_src}
								alt={item?.title || ''}
							/>
						) : (
							<Globe className='size-4'></Globe>
						)}
					</div>
					<div className='min-w-0'>
						<div className='text-foreground truncate text-sm font-semibold'>
							{item?.title || 'Select a link'}
						</div>
						{item?.url && <div className='text-std-400 truncate text-xs'>{item.url}</div>}
					</div>
				</div>
				<div className='flex shrink-0 items-center gap-2'>
					<Button
						variant='secondary'
						size='sm'
						disabled={!item || x.current_fetching_id === item.id}
						onClick={() => x.fetchSelectedLink()}
					>
						{x.current_fetching_id === item?.id ? (
							<Loader className='size-3.5 animate-spin'></Loader>
						) : (
							<RefreshCw className='size-3.5'></RefreshCw>
						)}
						<span>{has_content ? 'Refetch' : 'Fetch'}</span>
					</Button>
				</div>
			</div>
			<div
				className='
					overflow-y-auto
					flex-1
					min-h-0
					px-6 py-5
				'
			>
				{x.detail_loading ? (
					<div
						className='
							flex
							items-center justify-center
							h-full
							gap-2
							text-sm text-std-300
						'
					>
						<Loader className='size-4 animate-spin'></Loader>
						<span>Loading content</span>
					</div>
				) : has_content ? (
					<div className='mx-auto w-full max-w-4xl'>
						<MessageResponse className='w-full text-[15px] leading-7'>
							{x.detail?.article?.content || ''}
						</MessageResponse>
					</div>
				) : (
					<div
						className='
								flex flex-col
								items-center justify-center
								h-full
								gap-3
								text-sm text-std-300
							'
					>
						<Globe className='size-5'></Globe>
						<span>{item ? 'No fetched markdown yet' : 'Select a link to inspect content'}</span>
					</div>
				)}
			</div>
			<div
				className='
					flex shrink-0
					items-center justify-between
					gap-3
					px-5 py-3
					bg-background/80
					border-t border-border-light
				'
			>
				<button
					className='
						flex flex-1
						items-center
						min-w-0
						gap-3
						px-4 py-3
						rounded-3xl
						text-left
						bg-secondary/40
						border border-border-light
						transition-colors
						hover:bg-secondary/70
					'
					type='button'
					onClick={() => x.setSessionDialogOpen(true)}
				>
					<div
						className={$cx(
							'mt-0.5 size-2 shrink-0 rounded-full',
							x.linkcase_session_running ? 'bg-emerald-500' : 'bg-std-300'
						)}
					></div>
					<div className='min-w-0 flex-1'>
						<div className='truncate text-sm font-medium'>{toolbar_status}</div>
						<div className='text-std-400 truncate text-xs'>
							{x.batch_last_run_at
								? `Last submit ${dayjs(x.batch_last_run_at).format('HH:mm:ss')}`
								: 'Open session to inspect batch fetch runs'}
						</div>
					</div>
					<Bot className='text-std-400 size-4 shrink-0'></Bot>
				</button>
				<Button
					variant={x.batch_scheduler_enabled ? 'outline' : 'default'}
					size='sm'
					onClick={
						x.batch_scheduler_enabled ? x.stopBatchSchedule : () => x.setStartDialogOpen(true)
					}
				>
					<TimerReset className='size-3.5'></TimerReset>
					<span>{x.batch_scheduler_enabled ? 'Stop' : 'Start'}</span>
				</Button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

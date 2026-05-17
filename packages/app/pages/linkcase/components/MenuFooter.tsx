import dayjs from 'dayjs'
import { ArrowDownToLine, Bot, TimerReset } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const toolbar_status = x.batch_status_text
	const next_run_summary = x.batch_next_run_texts.join(' · ')

	return (
		<div
			className='
				flex shrink-0
				items-center justify-between
				gap-3
				px-3 py-3
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
						{next_run_summary
							? next_run_summary
							: x.batch_last_run_at
								? `Last submit ${dayjs(x.batch_last_run_at).format('HH:mm:ss')}`
								: 'Open session to inspect batch fetch runs'}
					</div>
				</div>
				<Bot className='text-std-400 size-4 shrink-0'></Bot>
			</button>
			<Button variant='outline' size='sm' onClick={x.openSnifferDialog}>
				<ArrowDownToLine className='size-3.5'></ArrowDownToLine>
				<span>Bookmarks</span>
			</Button>
			<Button
				variant={x.batch_scheduler_enabled ? 'outline' : 'default'}
				size='sm'
				onClick={x.batch_scheduler_enabled ? x.stopBatchSchedule : () => x.setStartDialogOpen(true)}
			>
				<TimerReset className='size-3.5'></TimerReset>
				<span>{x.batch_scheduler_enabled ? 'Stop' : 'Start'}</span>
			</Button>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import dayjs from 'dayjs'
import { ArrowDownToLine, Bot, Plus, TimerReset } from 'lucide-react'
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
				fixed
				right-5 bottom-5
				z-20
				w-[360px] max-w-[calc(100vw-2.5rem)]
			'
		>
			<div
				className='
					p-3
					rounded-[28px]
					bg-background/88
					border border-border-light
					shadow-[0_20px_60px_rgba(15,23,42,0.18)]
					backdrop-blur-xl
				'
			>
				<div
					className='
						px-1
						pb-2
						text-[11px] text-std-300 font-medium tracking-[0.18em]
						uppercase
					'
				>
					Control Center
				</div>
				<div className='flex items-stretch gap-2'>
					<button
						className='
							flex flex-1
							items-center
							min-w-0
							gap-3
							px-4 py-3
							rounded-[24px]
							text-left
							bg-secondary/45
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
					<div className='flex shrink-0 flex-col gap-2'>
						<Button variant='outline' size='sm' onClick={x.openAddDialog}>
							<Plus className='size-3.5'></Plus>
							<span>Add Link</span>
						</Button>
						<Button variant='outline' size='sm' onClick={x.openSnifferDialog}>
							<ArrowDownToLine className='size-3.5'></ArrowDownToLine>
							<span>Bookmarks</span>
						</Button>
						<Button
							variant={x.batch_scheduler_enabled ? 'outline' : 'default'}
							size='sm'
							onClick={
								x.batch_scheduler_enabled
									? x.stopBatchSchedule
									: () => x.setStartDialogOpen(true)
							}
						>
							<TimerReset className='size-3.5'></TimerReset>
							<span>{x.batch_scheduler_enabled ? 'Stop' : 'Start'}</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

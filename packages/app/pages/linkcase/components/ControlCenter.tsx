import { ArrowDownToLine, Plus, TimerReset } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Tooltip } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const should_highlight_import = !x.loading && x.items.length === 0

	return (
		<div
			className='
				absolute
				right-3 bottom-3
				z-20
			'
		>
			<div
				className='
					flex
					gap-0.5
					p-0.5
					rounded-[28px]
					text-std-150
					bg-std-black/72
					border border-border-light
					shadow-[0_20px_60px_rgba(15,23,42,0.18)]
					backdrop-blur-xl
				'
			>
				<Tooltip title='Batch session'>
					<div
						className='icon_button text-std-150 hover:bg-std-black'
						onClick={() => x.setSessionDialogOpen(true)}
					>
						<span
							className={$cx(
								'size-2 shrink-0 rounded-full',
								x.linkcase_session_running ? 'bg-emerald-500' : 'bg-std-300'
							)}
						></span>
					</div>
				</Tooltip>
				<Tooltip title='Import bookmarks'>
					<div
						className='
							relative
							isolate
							overflow-visible
							text-std-150
							hover:bg-std-black
							icon_button
						'
						onClick={x.openSnifferDialog}
					>
						{should_highlight_import && (
							<>
								<span
									className='
										absolute
										inset-0
										rounded-full
										bg-green-400/20
										animate-pulse
										pointer-events-none
									'
								></span>
								<span
									className='
										absolute
										inset-[-4px]
										rounded-full
										border border-green-300/70
										animate-ping
										pointer-events-none
									'
								></span>
								<span
									className='
										absolute
										top-0 right-0
										size-2
										rounded-full
										bg-green-300
										shadow-[0_0_12px_rgba(125,211,252,0.9)]
										animate-bounce
										pointer-events-none
									'
								></span>
							</>
						)}
						<ArrowDownToLine className='relative z-10 size-3.5'></ArrowDownToLine>
					</div>
				</Tooltip>
				<Tooltip title='Add link'>
					<div className='icon_button text-std-150 hover:bg-std-black' onClick={x.openAddDialog}>
						<Plus className='size-3.5'></Plus>
					</div>
				</Tooltip>
				<Tooltip title={x.batch_scheduler_enabled ? 'Stop batch schedule' : 'Start batch schedule'}>
					<div
						className='icon_button text-std-150 hover:bg-std-black'
						onClick={
							x.batch_scheduler_enabled
								? x.stopBatchSchedule
								: () => x.setStartDialogOpen(true)
						}
					>
						<TimerReset className='size-3.5'></TimerReset>
					</div>
				</Tooltip>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

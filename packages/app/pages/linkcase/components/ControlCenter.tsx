import { ArrowDownToLine, Import, Plus, TimerReset } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div
			className='
				fixed
				right-5 bottom-5
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
				<button
					className='icon_button text-std-150 hover:bg-std-black'
					type='button'
					onClick={() => x.setSessionDialogOpen(true)}
				>
					<span
						className={$cx(
							'size-2 shrink-0 rounded-full',
							x.linkcase_session_running ? 'bg-emerald-500' : 'bg-std-300'
						)}
					></span>
				</button>
				<button className='icon_button text-std-150 hover:bg-std-black' onClick={x.openSnifferDialog}>
					<ArrowDownToLine className='size-3.5'></ArrowDownToLine>
				</button>
				<button className='icon_button text-std-150 hover:bg-std-black' onClick={x.openAddDialog}>
					<Plus className='size-3.5'></Plus>
				</button>
				<button
					className='icon_button text-std-150 hover:bg-std-black'
					onClick={
						x.batch_scheduler_enabled ? x.stopBatchSchedule : () => x.setStartDialogOpen(true)
					}
				>
					<TimerReset className='size-3.5'></TimerReset>
				</button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { Bot, CalendarClock, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard title='PThink' desc='Autonomous reporting status, schedule pressure, and runtime health.'>
			<div className='grid gap-3'>
				<div
					className={`rounded-2xl border p-4${
						x.pthink_enabled ? 'border-emerald-500/40' : 'border-border/70'
					}`}
				>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Bot className={x.pthink_enabled ? 'text-emerald-600' : 'text-std-400'} />
						<span>
							{x.pthink_enabled
								? 'Autonomous reporting enabled'
								: 'Autonomous reporting disabled'}
						</span>
					</div>
					<div className='text-std-400 mt-2 text-sm leading-6'>
						Idle trigger after {x.pthink_idle_mins} minutes. Daily report{' '}
						{x.pthink_config?.daily_report_enabled
							? `on at ${x.pthink_config?.daily_report_hour ?? 21}:00`
							: 'off'}
						. Weekly report{' '}
						{x.pthink_config?.weekly_report_enabled
							? `on ${x.pthink_weekly_day} ${x.pthink_config?.weekly_report_hour ?? 20}:00`
							: 'off'}
						.
					</div>
					<div className='text-std-400 mt-2 text-sm leading-6'>{x.pthink_runtime_label}</div>
				</div>

				<div className='border-border/70 rounded-2xl border p-4'>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Sparkles className='text-amber-600' />
						<span>Top signal</span>
					</div>
					<div className='mt-2 text-sm leading-6'>{x.pthink_alert_label}</div>
				</div>

				<div>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<CalendarClock className='text-sky-600' />
						<span>Runtime and config</span>
					</div>
					<div className='mt-3 grid gap-3 sm:grid-cols-2'>
						{x.pthink_runtime_items.map(item => (
							<div className='border-border/70 rounded-2xl border p-4' key={item.key}>
								<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
									{item.label}
								</div>
								<div className='mt-2 text-sm leading-6'>{item.value}</div>
							</div>
						))}
					</div>
				</div>

				<div className='grid gap-3 sm:grid-cols-3'>
					{x.pthink_depth_items.map(item => (
						<div className='border-border/70 rounded-2xl border p-4' key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-xl font-semibold tracking-tight'>{item.value}</div>
							{item.desc ? (
								<div className='text-std-400 mt-2 text-sm leading-5'>{item.desc}</div>
							) : null}
						</div>
					))}
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)

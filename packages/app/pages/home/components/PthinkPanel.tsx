import { Bot, CalendarClock, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='PThink'
			desc='Autonomous reporting status, schedule pressure, and the latest generated reports.'
		>
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
						<span>Recent reports</span>
					</div>
					<div className='divide-border/60 mt-3 divide-y'>
						{x.recent_reports.length > 0 ? (
							x.recent_reports.map(item => (
								<Link
									className='
										block
										py-3
										transition-colors
										hover:text-std-900
										first:pt-0 last:pb-0
									'
									key={item.id}
									to={`/post/${item.id}`}
								>
									<div className='flex items-center justify-between gap-3'>
										<div className='truncate text-sm font-medium'>
											{item.title || 'Untitled report'}
										</div>
										<div className='text-std-400 shrink-0 text-xs'>
											{item.created_label}
										</div>
									</div>
									<div className='text-std-400 mt-1 text-xs capitalize'>
										{item.meta_label}
									</div>
								</Link>
							))
						) : (
							<div
								className='
									px-3 py-4
									rounded-2xl
									text-sm text-std-400
									border border-border/70 border-dashed
								'
							>
								No autonomous report yet.
							</div>
						)}
					</div>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)

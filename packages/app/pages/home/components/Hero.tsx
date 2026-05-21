import { Activity, Bot, CalendarClock, FileStack } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const coverage = x.data!.coverage

	return (
		<section
			className='
				relative
				overflow-hidden
				p-6
				rounded-[36px]
				bg-[radial-gradient(circle_at_top_left,rgba(var(--color_text_rgb),0.08),transparent_34%),linear-gradient(135deg,rgba(var(--color_text_rgb),0.02),transparent_58%),linear-gradient(180deg,rgba(var(--color_bg_rgb),0.96),rgba(var(--color_bg_rgb),0.88))]
				border border-border/70
				shadow-sm
			'
		>
			<div className='absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(var(--color_text_rgb),0.03),transparent)] opacity-70' />
			<div
				className='
					relative
					flex flex-col
					gap-6
					lg:flex-row lg:items-end lg:justify-between
				'
			>
				<div className='max-w-[720px]'>
					<div className='text-std-400 text-xs tracking-[0.28em] uppercase'>Workspace Pulse</div>
					<h1
						className='
							mt-3
							text-3xl font-semibold tracking-tight
							md:text-4xl
						'
					>
						Agentic content system, surfaced as a daily operating board.
					</h1>
					<p
						className='
							max-w-[62ch]
							mt-3
							text-std-400 text-sm leading-6
							md:text-base
						'
					>
						首页直接从 schema 和 `message.metadata.usage` 聚合真实工作负载，并把 `post-think`
						的后台洞察、定时报告和触发状态一起投影出来。
					</p>
					<div className='mt-4 flex flex-wrap gap-2'>
						<Link className='click_button active' to='/session'>
							<Activity className='size-3.5' />
							<span>Open Sessions</span>
						</Link>
						<Link className='click_button' to='/post'>
							<FileStack className='size-3.5' />
							<span>Open Posts</span>
						</Link>
						<Link className='click_button' to='/setting'>
							<CalendarClock className='size-3.5' />
							<span>Configure PThink</span>
						</Link>
					</div>
				</div>

				<div
					className='
						grid
						min-w-0
						gap-3
						sm:grid-cols-2 lg:w-[380px]
					'
				>
					<div
						className='
							p-4
							rounded-3xl
							bg-background/82
							border border-border/60
						'
					>
						<div className='text-std-400 text-xs tracking-[0.22em] uppercase'>Post-Think</div>
						<div
							className='
								flex
								items-center
								gap-2
								mt-3
								text-lg font-semibold
							'
						>
							<Bot className={x.pthink_enabled ? 'text-emerald-600' : 'text-std-400'} />
							<span>{x.pthink_enabled ? 'Enabled' : 'Disabled'}</span>
						</div>
						<div className='text-std-400 mt-2 text-sm leading-5'>
							Idle grace {x.pthink_idle_mins} min · daily{' '}
							{x.pthink_config?.daily_report_enabled
								? `${x.pthink_config?.daily_report_hour ?? 21}:00`
								: 'off'}{' '}
							· weekly{' '}
							{x.pthink_config?.weekly_report_enabled
								? `${x.pthink_weekly_day} ${x.pthink_config?.weekly_report_hour ?? 20}:00`
								: 'off'}
						</div>
						<div className='text-std-400 mt-2 text-xs leading-5'>
							{x.data!.pthink.status.last_status === 'error'
								? `Last run failed: ${x.data!.pthink.status.last_error || 'unknown error'}`
								: x.pthink_last_label}
						</div>
					</div>

					<div
						className='
							p-4
							rounded-3xl
							bg-background/82
							border border-border/60
						'
					>
						<div className='text-std-400 text-xs tracking-[0.22em] uppercase'>
							Telemetry Coverage
						</div>
						<div className='mt-3 text-lg font-semibold'>
							{coverage.has_usage_telemetry ? 'Complete' : 'Schema-backed only'}
						</div>
						<div className='text-std-400 mt-2 text-sm leading-5'>{coverage.note}</div>
					</div>
				</div>
			</div>
		</section>
	)
}

export default observer(Index)

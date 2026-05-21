import { useLayoutEffect, useState } from 'react'
import {
	Activity,
	Bell,
	Bot,
	BrainCircuit,
	CalendarClock,
	CircleAlert,
	Database,
	FileStack,
	RefreshCw,
	Sparkles,
	Workflow
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'
import { formatDateTime, fromNow } from '@/utils'

import Model from './model'

import type { ReactNode } from 'react'

const formatCompact = (value: number) =>
	Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

const weekday_label_map = {
	sun: 'Sunday',
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday'
} as const

const StatCard = (props: { title: string; value: string; desc: string; Icon: typeof Activity; tone: string }) => {
	const { title, value, desc, Icon, tone } = props

	return (
		<div
			className='
				p-4
				rounded-3xl
				bg-background/85
				border border-border/70
				shadow-sm
				backdrop-blur-sm
			'
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<div className='text-std-400 text-xs tracking-[0.22em] uppercase'>{title}</div>
					<div className='mt-3 text-3xl font-semibold tracking-tight'>{value}</div>
					<div className='text-std-400 mt-2 text-sm leading-5'>{desc}</div>
				</div>
				<div
					className={`
						flex shrink-0
						items-center justify-center
						size-10
						rounded-2xl
						${tone}`}
				>
					<Icon className='size-4' />
				</div>
			</div>
		</div>
	)
}

const SectionCard = (props: { title: string; desc: string; action?: ReactNode; children: ReactNode }) => {
	const { title, desc, action, children } = props

	return (
		<section
			className='
				p-5
				rounded-[28px]
				bg-background/80
				border border-border/70
				shadow-sm
				backdrop-blur-sm
			'
		>
			<div
				className='
					flex flex-wrap
					items-start justify-between
					gap-3
				'
			>
				<div>
					<div className='text-base font-semibold'>{title}</div>
					<div className='text-std-400 mt-1 text-sm'>{desc}</div>
				</div>
				{action}
			</div>
			<div className='mt-5'>{children}</div>
		</section>
	)
}

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()
	const snapshot = x.snapshot
	const pthink = global.setting.config?.pthink
	const pthink_enabled = Boolean(pthink?.enabled)
	const pthink_idle_mins = Math.round((pthink?.idle_grace_ms ?? 20 * 60 * 1000) / 60000)
	const weekly_day = weekday_label_map[pthink?.weekly_report_weekday ?? 'sun']

	useLayoutEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	if (!snapshot) {
		return (
			<div className='h-full overflow-y-auto'>
				<div
					className='
						flex flex-col
						w-full max-w-[1180px]
						gap-4
						px-5 py-5
						mx-auto
						md:px-7
					'
				>
					<div
						className='
							p-6
							rounded-[32px]
							bg-background/80
							border border-border/70
							shadow-sm
						'
					>
						<div className='text-lg font-semibold'>Home</div>
						<div className='text-std-400 mt-2 text-sm'>
							{x.loading ? 'Loading workspace snapshot...' : 'No homepage snapshot yet.'}
						</div>
					</div>
				</div>
			</div>
		)
	}

	const pthink_status = snapshot.pthink.status
	const pthink_last_summary = pthink_status.last_summary
	const pthink_last_label =
		pthink_last_summary?.created_at && pthink_last_summary.title
			? `${pthink_last_summary.title} · ${fromNow(pthink_last_summary.created_at)}`
			: 'No report generated yet'

	const overview_cards = [
		{
			title: 'Sessions',
			value: formatCompact(snapshot.overview.session_total),
			desc: `${snapshot.overview.sessions_running} running · ${snapshot.overview.sessions_unread} unread · ${snapshot.overview.sessions_week} created this week`,
			Icon: Activity,
			tone: 'bg-sky-500/12 text-sky-600'
		},
		{
			title: 'Tokens',
			value: formatCompact(snapshot.usage.total_tokens),
			desc: `${formatCompact(snapshot.usage.week_total_tokens)} this week · avg ${formatCompact(snapshot.usage.avg_total_tokens_per_reply)} per assistant reply`,
			Icon: Sparkles,
			tone: 'bg-amber-500/12 text-amber-600'
		},
		{
			title: 'Content',
			value: formatCompact(snapshot.content.article_total + snapshot.content.document_total),
			desc: `${snapshot.content.document_total} docs · ${snapshot.content.article_total} articles · ${snapshot.content.chunk_total} chunks`,
			Icon: FileStack,
			tone: 'bg-emerald-500/12 text-emerald-600'
		},
		{
			title: 'Memory Graph',
			value: formatCompact(snapshot.memory.node_total + snapshot.memory.edge_total),
			desc: `${snapshot.memory.node_total} nodes · ${snapshot.memory.edge_total} edges · ${snapshot.memory.rewire_event_week} rewire events this week`,
			Icon: BrainCircuit,
			tone: 'bg-rose-500/12 text-rose-600'
		}
	]

	return (
		<div className='h-full overflow-y-auto'>
			<div
				className='
					flex flex-col
					w-full max-w-[1180px]
					gap-4
					px-5 py-5
					mx-auto
					md:px-7
				'
			>
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
							<div className='text-std-400 text-xs tracking-[0.28em] uppercase'>
								Workspace Pulse
							</div>
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
								首页直接从 schema 和 `message.metadata.usage` 聚合真实工作负载，并把
								`post-think` 的后台洞察、定时报告和触发状态一起投影出来。
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
								<div className='text-std-400 text-xs tracking-[0.22em] uppercase'>
									Post-Think
								</div>
								<div
									className='
										flex
										items-center
										gap-2
										mt-3
										text-lg font-semibold
									'
								>
									<Bot
										className={
											pthink_enabled ? 'text-emerald-600' : 'text-std-400'
										}
									/>
									<span>{pthink_enabled ? 'Enabled' : 'Disabled'}</span>
								</div>
								<div className='text-std-400 mt-2 text-sm leading-5'>
									Idle grace {pthink_idle_mins} min · daily{' '}
									{pthink?.daily_report_enabled
										? `${pthink?.daily_report_hour ?? 21}:00`
										: 'off'}{' '}
									· weekly{' '}
									{pthink?.weekly_report_enabled
										? `${weekly_day} ${pthink?.weekly_report_hour ?? 20}:00`
										: 'off'}
								</div>
								<div className='text-std-400 mt-2 text-xs leading-5'>
									{pthink_status.last_status === 'error'
										? `Last run failed: ${pthink_status.last_error || 'unknown error'}`
										: pthink_last_label}
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
									{snapshot.coverage.has_usage_telemetry
										? 'Complete'
										: 'Schema-backed only'}
								</div>
								<div className='text-std-400 mt-2 text-sm leading-5'>
									{snapshot.coverage.note}
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
					{overview_cards.map(item => (
						<StatCard key={item.title} {...item} />
					))}
				</section>

				<div className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
					<div className='grid gap-4'>
						<SectionCard
							title='AI Usage and Knowledge Assets'
							desc='token 使用、模型归因、内容资产和处理状态。'
							action={
								<button
									className='click_button'
									type='button'
									onClick={() => void x.refresh()}
									disabled={x.loading}
								>
									<RefreshCw className={x.loading ? 'animate-spin' : ''} />
									<span>{x.loading ? 'Refreshing' : 'Refresh'}</span>
								</button>
							}
						>
							<div className='grid gap-3 xl:grid-cols-2'>
								<div className='bg-secondary/60 rounded-3xl p-4 xl:col-span-2'>
									<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>
										AI Usage
									</div>
									<div className='mt-3 grid gap-3 md:grid-cols-4'>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>
												Total
											</div>
											<div className='mt-2 text-2xl font-semibold'>
												{formatCompact(snapshot.usage.total_tokens)}
											</div>
										</div>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>
												Input
											</div>
											<div className='mt-2 text-2xl font-semibold'>
												{formatCompact(snapshot.usage.input_tokens)}
											</div>
										</div>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>
												Output
											</div>
											<div className='mt-2 text-2xl font-semibold'>
												{formatCompact(snapshot.usage.output_tokens)}
											</div>
										</div>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>
												Reasoning
											</div>
											<div className='mt-2 text-2xl font-semibold'>
												{formatCompact(snapshot.usage.reasoning_tokens)}
											</div>
										</div>
									</div>
									<div className='mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]'>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div
												className='
													mb-2
													text-std-400 text-xs tracking-[0.16em]
													uppercase
												'
											>
												Top Models
											</div>
											<div className='flex flex-col gap-2'>
												{snapshot.usage.models.map(item => (
													<div
														className='
															flex
															items-center justify-between
															gap-3
															px-3 py-2
															rounded-2xl
															border border-border/60
														'
														key={item.key}
													>
														<div className='min-w-0'>
															<div className='truncate text-sm font-medium'>
																{item.label}
															</div>
															<div className='text-std-400 truncate text-xs'>
																{item.calls} calls ·
																source {item.source}
															</div>
														</div>
														<div className='text-right'>
															<div className='text-sm font-semibold'>
																{formatCompact(
																	item.total_tokens
																)}
															</div>
															<div className='text-std-400 text-xs'>
																tokens
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div
												className='
													mb-2
													text-std-400 text-xs tracking-[0.16em]
													uppercase
												'
											>
												Providers
											</div>
											<div className='flex flex-col gap-2'>
												{snapshot.usage.providers.map(item => (
													<div
														className='
															flex
															items-center justify-between
															gap-3
															px-3 py-2
															rounded-2xl
															border border-border/60
														'
														key={item.provider}
													>
														<div>
															<div className='text-sm font-medium'>
																{item.provider}
															</div>
															<div className='text-std-400 text-xs'>
																{item.calls} calls
															</div>
														</div>
														<div className='text-right text-sm font-semibold'>
															{formatCompact(
																item.total_tokens
															)}
														</div>
													</div>
												))}
											</div>
											<div className='text-std-400 mt-3 text-xs leading-5'>
												Cached input{' '}
												{formatCompact(
													snapshot.usage.cached_input_tokens
												)}{' '}
												· assistant replies{' '}
												{snapshot.usage.assistant_messages}
											</div>
										</div>
									</div>
								</div>
								<div className='bg-secondary/60 rounded-3xl p-4'>
									<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>
										Posts
									</div>
									<div className='mt-3 text-2xl font-semibold'>
										{formatCompact(
											snapshot.content.post_for_counts.user +
												snapshot.content.post_for_counts.wiki +
												snapshot.content.post_for_counts.memory
										)}
									</div>
									<div className='text-std-400 mt-2 text-sm'>
										User {snapshot.content.post_for_counts.user} · Wiki{' '}
										{snapshot.content.post_for_counts.wiki} · Memory{' '}
										{snapshot.content.post_for_counts.memory}
									</div>
									<div className='text-std-400 mt-2 text-sm'>
										{snapshot.content.posts_pending} posts are still waiting for
										pipeline completion.
									</div>
								</div>
								<div className='bg-secondary/60 rounded-3xl p-4'>
									<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>
										Pipeline
									</div>
									<div className='mt-3 text-2xl font-semibold'>
										{formatCompact(
											snapshot.content.documents_pending +
												snapshot.content.articles_pending
										)}
									</div>
									<div className='text-std-400 mt-2 text-sm'>
										{snapshot.content.documents_pending} documents pending ·{' '}
										{snapshot.content.articles_pending} non-post articles
										pending
									</div>
									<div className='text-std-400 mt-2 text-sm'>
										Average {snapshot.content.avg_chunks_per_article} chunks per
										article · {snapshot.content.long_article_total} long
										articles
									</div>
								</div>
								<div className='bg-secondary/60 rounded-3xl p-4'>
									<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>
										Linkcase
									</div>
									<div className='mt-3 text-2xl font-semibold'>
										{formatCompact(snapshot.content.link_total)}
									</div>
									<div className='text-std-400 mt-2 text-sm'>
										{snapshot.content.link_ready_total} ready ·{' '}
										{snapshot.content.link_pending_total} waiting or pending
									</div>
								</div>
								<div className='bg-secondary/60 rounded-3xl p-4'>
									<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>
										System Footprint
									</div>
									<div className='mt-3 text-2xl font-semibold'>
										{formatCompact(
											snapshot.system.agent_total +
												snapshot.system.project_total +
												snapshot.system.skill_total
										)}
									</div>
									<div className='text-std-400 mt-2 text-sm'>
										{snapshot.system.agent_total} agents ·{' '}
										{snapshot.system.project_total} projects ·{' '}
										{snapshot.system.skill_total} skills
									</div>
									<div className='text-std-400 mt-2 text-sm'>
										{snapshot.system.group_total} groups ·{' '}
										{snapshot.system.im_account_enabled}/
										{snapshot.system.im_account_total} IM accounts enabled
									</div>
								</div>
							</div>
						</SectionCard>

						<SectionCard
							title='Recent Changes'
							desc='最近变动最大的交互对象，帮助用户快速回到上下文。'
						>
							<div className='grid gap-4 lg:grid-cols-3'>
								<div className='bg-secondary/55 rounded-3xl p-4'>
									<div
										className='
											flex
											items-center
											gap-2
											mb-3
											text-sm font-medium
										'
									>
										<Activity className='text-sky-600' />
										<span>Sessions</span>
									</div>
									<div className='flex flex-col gap-2.5'>
										{snapshot.recent.sessions.map(item => (
											<div
												className='
													p-3
													rounded-2xl
													bg-background/80
													border border-border/60
												'
												key={item.id}
											>
												<div className='flex items-center justify-between gap-3'>
													<div className='truncate text-sm font-medium'>
														{item.title || 'Untitled session'}
													</div>
													<div className='text-std-400 shrink-0 text-xs'>
														{fromNow(item.updated_at)}
													</div>
												</div>
												<div className='text-std-400 mt-1 text-xs'>
													{item.is_runing
														? 'Running'
														: item.unread
															? 'Unread'
															: item.is_im
																? 'IM'
																: item.is_cron
																	? 'Cron'
																	: 'Idle'}
												</div>
											</div>
										))}
									</div>
								</div>

								<div className='bg-secondary/55 rounded-3xl p-4'>
									<div
										className='
											flex
											items-center
											gap-2
											mb-3
											text-sm font-medium
										'
									>
										<FileStack className='text-emerald-600' />
										<span>Posts</span>
									</div>
									<div className='flex flex-col gap-2.5'>
										{snapshot.recent.posts.map(item => (
											<Link
												className='
													block
													p-3
													rounded-2xl
													bg-background/80
													border border-border/60
													transition-colors
													hover:bg-background
												'
												key={item.id}
												to={`/post/${item.id}`}
											>
												<div className='flex items-center justify-between gap-3'>
													<div className='truncate text-sm font-medium'>
														{item.title || 'Untitled post'}
													</div>
													<div className='text-std-400 shrink-0 text-xs'>
														{fromNow(item.updated_at)}
													</div>
												</div>
												<div className='text-std-400 mt-1 text-xs capitalize'>
													{item.for_type} ·{' '}
													{item.is_pipelined
														? 'pipelined'
														: 'pending pipeline'}
												</div>
											</Link>
										))}
									</div>
								</div>

								<div className='bg-secondary/55 rounded-3xl p-4'>
									<div
										className='
											flex
											items-center
											gap-2
											mb-3
											text-sm font-medium
										'
									>
										<Bell className='text-amber-600' />
										<span>Notifications</span>
									</div>
									<div className='flex flex-col gap-2.5'>
										{snapshot.recent.notifications.map(item => (
											<div
												className='
													p-3
													rounded-2xl
													bg-background/80
													border border-border/60
												'
												key={item.id}
											>
												<div className='flex items-center justify-between gap-3'>
													<div className='truncate text-sm font-medium'>
														{item.title}
													</div>
													<div className='text-std-400 shrink-0 text-xs'>
														{fromNow(item.created_at)}
													</div>
												</div>
												<div className='text-std-400 mt-1 text-xs'>
													{item.is_read ? 'Read' : 'Unread'}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</SectionCard>
					</div>

					<div className='grid gap-4'>
						<SectionCard
							title='Memory and Graph'
							desc='rewire 背景循环当前能看到的知识结构面。'
						>
							<div className='grid gap-3'>
								<div className='bg-secondary/60 rounded-3xl p-4'>
									<div
										className='
											flex
											items-center
											gap-2
											text-sm font-medium
										'
									>
										<Workflow className='text-rose-600' />
										<span>Graph Surface</span>
									</div>
									<div
										className='
											grid grid-cols-2
											gap-3
											mt-3
											text-sm
										'
									>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>
												Nodes
											</div>
											<div className='mt-2 text-2xl font-semibold'>
												{formatCompact(snapshot.memory.node_total)}
											</div>
											<div className='text-std-400 mt-1 text-xs'>
												{snapshot.memory.frozen_node_total} frozen
											</div>
										</div>
										<div className='bg-background/80 rounded-2xl p-3'>
											<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>
												Edges
											</div>
											<div className='mt-2 text-2xl font-semibold'>
												{formatCompact(snapshot.memory.edge_total)}
											</div>
											<div className='text-std-400 mt-1 text-xs'>
												{snapshot.memory.frozen_edge_total} frozen
											</div>
										</div>
									</div>
									<div className='text-std-400 mt-3 text-sm'>
										{snapshot.memory.rewire_event_week} rewire events in the
										last 7 days, {snapshot.memory.rewire_event_total} total.
									</div>
								</div>

								<div className='bg-secondary/60 rounded-3xl p-4'>
									<div
										className='
											flex
											items-center
											gap-2
											text-sm font-medium
										'
									>
										<Database className='text-indigo-600' />
										<span>Task and Ops</span>
									</div>
									<div
										className='
											flex flex-col
											gap-2
											mt-3
											text-sm
										'
									>
										<div
											className='
												flex
												items-center justify-between
												px-3 py-2
												rounded-2xl
												bg-background/80
											'
										>
											<span>Open todos</span>
											<span className='font-semibold'>
												{snapshot.system.open_todo_total}
											</span>
										</div>
										<div
											className='
												flex
												items-center justify-between
												px-3 py-2
												rounded-2xl
												bg-background/80
											'
										>
											<span>Unread notifications</span>
											<span className='font-semibold'>
												{snapshot.system.notification_unread}
											</span>
										</div>
										<div
											className='
												flex
												items-center justify-between
												px-3 py-2
												rounded-2xl
												bg-background/80
											'
										>
											<span>Connected peers</span>
											<span className='font-semibold'>
												{snapshot.system.im_peer_total}
											</span>
										</div>
									</div>
								</div>
							</div>
						</SectionCard>

						<SectionCard
							title='PThink Status'
							desc='agentic post-think 的真实 runtime 状态、节流结果和最近生成的自主报告。'
						>
							<div className='grid gap-3'>
								<div
									className={`rounded-3xl border p-4${
										pthink_enabled
											? 'border-emerald-500/20 bg-emerald-500/6'
											: 'border-border/70 bg-secondary/55'
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
										<Bot
											className={
												pthink_enabled
													? 'text-emerald-600'
													: 'text-std-400'
											}
										/>
										<span>
											{pthink_enabled
												? 'Autonomous reporting enabled'
												: 'Autonomous reporting disabled'}
										</span>
									</div>
									<div className='text-std-400 mt-2 text-sm leading-6'>
										Idle trigger after {pthink_idle_mins} minutes. Daily report{' '}
										{pthink?.daily_report_enabled
											? `on at ${pthink?.daily_report_hour ?? 21}:00`
											: 'off'}
										. Weekly report{' '}
										{pthink?.weekly_report_enabled
											? `on ${weekly_day} ${pthink?.weekly_report_hour ?? 20}:00`
											: 'off'}
										.
									</div>
									<div className='text-std-400 mt-2 text-sm leading-6'>
										Runtime status: {pthink_status.last_status}
										{pthink_status.last_reason
											? ` · ${pthink_status.last_reason}`
											: ''}
										{pthink_status.last_error
											? ` · ${pthink_status.last_error}`
											: ''}
									</div>
								</div>

								<div className='bg-secondary/60 rounded-3xl p-4'>
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
									<div
										className='
											grid
											gap-2
											mt-3
											text-std-400 text-sm
										'
									>
										<div className='bg-background/80 rounded-2xl px-3 py-2'>
											Reports today/week/total:{' '}
											{snapshot.pthink.report_today} /{' '}
											{snapshot.pthink.report_week} /{' '}
											{snapshot.pthink.report_total}
										</div>
										<div className='bg-background/80 rounded-2xl px-3 py-2'>
											Trigger insights:{' '}
											{pthink?.trigger_enabled ? 'enabled' : 'disabled'}
										</div>
										<div className='bg-background/80 rounded-2xl px-3 py-2'>
											Max reports per day:{' '}
											{pthink?.max_reports_per_day ?? 3}
										</div>
										<div className='bg-background/80 rounded-2xl px-3 py-2'>
											Last report: {pthink_last_label}
										</div>
										<div className='bg-background/80 rounded-2xl px-3 py-2'>
											Last snapshot refresh:{' '}
											{x.last_loaded_at
												? formatDateTime(
														x.last_loaded_at,
														'YYYY-MM-DD HH:mm'
													)
												: 'not loaded'}
										</div>
									</div>
								</div>

								<div className='bg-secondary/60 rounded-3xl p-4'>
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
									<div className='mt-3 flex flex-col gap-2.5'>
										{snapshot.recent.pthink_reports.length > 0 ? (
											snapshot.recent.pthink_reports.map(item => (
												<Link
													className='
														block
														p-3
														rounded-2xl
														bg-background/80
														border border-border/60
														transition-colors
														hover:bg-background
													'
													key={item.id}
													to={`/post/${item.id}`}
												>
													<div className='flex items-center justify-between gap-3'>
														<div className='truncate text-sm font-medium'>
															{item.title ||
																'Untitled report'}
														</div>
														<div className='text-std-400 shrink-0 text-xs'>
															{fromNow(item.created_at)}
														</div>
													</div>
													<div className='text-std-400 mt-1 text-xs capitalize'>
														{item.kind}
														{item.trigger_key
															? ` · ${item.trigger_key}`
															: ''}
													</div>
												</Link>
											))
										) : (
											<div
												className='
													px-3 py-3
													rounded-2xl
													text-std-400 text-sm
													bg-background/80
												'
											>
												No autonomous report yet.
											</div>
										)}
									</div>
								</div>

								<div
									className='
										p-4
										rounded-3xl
										bg-amber-500/6
										border border-amber-500/20
									'
								>
									<div className='flex items-start gap-2 text-sm'>
										<CircleAlert className='mt-0.5 shrink-0 text-amber-600' />
										<div>
											<div className='font-medium'>Attribution note</div>
											<div className='text-std-400 mt-1 leading-6'>
												Token usage now comes from
												`message.metadata.usage`. Model attribution is
												inferred from sender and session bindings, so
												group and agent flows are strong, but plain
												default-model sessions remain fallback-based.
											</div>
										</div>
									</div>
								</div>
							</div>
						</SectionCard>
					</div>
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

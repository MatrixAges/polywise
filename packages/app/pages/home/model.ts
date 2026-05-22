import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import GlobalModel from '@/models/global'
import { formatDate, formatDateTime, fromNow, rpc } from '@/utils'

import type { ChartConfig } from '@/__shadcn__/components/ui/chart'
import type {
	HomeGeneratedReport,
	HomeHeatmapCell,
	HomeModelItem,
	HomeOverviewCard,
	HomeReportPeriod,
	HomeReportStatus,
	HomeRuntimeItem,
	HomeSnapshot,
	HomeStatsPeriod,
	HomeTrendPoint
} from './types'

const compact_formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

const weekday_label_map = {
	sun: 'Sunday',
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday'
} as const
const stats_period_options = ['week', 'day', 'month', 'year', 'total'] as const
const stats_period_title_map: Record<HomeStatsPeriod, string> = {
	day: 'Today',
	week: 'This week',
	month: 'Last 30 days',
	year: 'Last 365 days',
	total: 'All time'
}
const stats_period_window_map: Record<HomeStatsPeriod, string> = {
	day: 'today',
	week: 'this week',
	month: 'in the last 30 days',
	year: 'in the last 365 days',
	total: 'in total'
}
const stats_period_adjective_map: Record<HomeStatsPeriod, string> = {
	day: 'Daily',
	week: 'Weekly',
	month: 'Monthly',
	year: 'Yearly',
	total: 'Total'
}
const home_stats_period_items = stats_period_options.map(value => ({
	value,
	label: stats_period_title_map[value]
}))
const home_report_period_items = home_stats_period_items.filter(item => item.value !== 'total') as Array<{
	value: HomeReportPeriod
	label: string
}>

const formatCompact = (value: number) => compact_formatter.format(value)
const formatInteger = (value: number) => value.toLocaleString('en-US')
const formatPercent = (value: number) => `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`
const formatRatio = (value: number) => `${value.toFixed(value >= 10 ? 0 : 1)}x`
const joinNonZeroMeta = (items: Array<[number, string]>) =>
	items
		.filter(([value]) => value !== 0)
		.map(([, label]) => label)
		.join(' · ')
const activity_heatmap_weights = {
	message: 1,
	session: 4,
	post: 6,
	rewire: 2,
	report: 8
} as const

const getHeatmapScore = (item: {
	messages: number
	new_sessions: number
	new_posts: number
	rewire_events: number
	pthink_reports: number
}) =>
	item.messages * activity_heatmap_weights.message +
	item.new_sessions * activity_heatmap_weights.session +
	item.new_posts * activity_heatmap_weights.post +
	item.rewire_events * activity_heatmap_weights.rewire +
	item.pthink_reports * activity_heatmap_weights.report

const getQuantile = (values: Array<number>, ratio: number) => {
	if (values.length === 0) {
		return 0
	}

	const index = Math.min(values.length - 1, Math.floor((values.length - 1) * ratio))

	return values[index] ?? 0
}

const getStartOfLocalDay = (value: number) => {
	const date = new Date(value)

	date.setHours(0, 0, 0, 0)

	return date
}

const getStartOfLocalWeek = (value: number) => {
	const date = getStartOfLocalDay(value)
	const weekday = (date.getDay() + 6) % 7

	date.setDate(date.getDate() - weekday)

	return date
}

const getStartOfLocalMonth = (value: number) => {
	const date = getStartOfLocalDay(value)

	date.setDate(1)

	return date
}

const getStartOfLocalYear = (value: number) => {
	const date = getStartOfLocalDay(value)

	date.setMonth(0, 1)

	return date
}

const getReportWindowStart = (period: HomeStatsPeriod, offset: number, now = Date.now()) => {
	switch (period) {
		case 'day': {
			const date = getStartOfLocalDay(now)

			date.setDate(date.getDate() - offset)

			return date
		}
		case 'week': {
			const date = getStartOfLocalWeek(now)

			date.setDate(date.getDate() - offset * 7)

			return date
		}
		case 'month': {
			const date = getStartOfLocalMonth(now)

			date.setMonth(date.getMonth() - offset)

			return date
		}
		case 'year': {
			const date = getStartOfLocalYear(now)

			date.setFullYear(date.getFullYear() - offset)

			return date
		}
		case 'total':
			return new Date(0)
	}
}

const getReportWindowEnd = (period: HomeStatsPeriod, start: Date) => {
	if (period === 'total') {
		return null
	}

	const end = new Date(start)

	switch (period) {
		case 'day':
			end.setDate(end.getDate() + 1)
			return end
		case 'week':
			end.setDate(end.getDate() + 7)
			return end
		case 'month':
			end.setMonth(end.getMonth() + 1)
			return end
		case 'year':
			end.setFullYear(end.getFullYear() + 1)
			return end
		case 'total':
			return null
	}
}

const formatReportWindowLabel = (period: HomeStatsPeriod, offset: number, start: Date, end: Date | null) => {
	if (period === 'total') {
		return 'All reports'
	}

	if (period === 'day') {
		if (offset === 0) {
			return 'Today'
		}

		if (offset === 1) {
			return 'Yesterday'
		}

		return formatDate(start.getTime(), 'MMM D, YYYY')
	}

	if (period === 'week') {
		if (offset === 0) {
			return 'This week'
		}

		if (offset === 1) {
			return 'Last week'
		}

		const end_label = end ? formatDate(end.getTime() - 1, 'MMM D') : ''

		return `${formatDate(start.getTime(), 'MMM D')} - ${end_label}`
	}

	if (period === 'month') {
		if (offset === 0) {
			return 'This month'
		}

		if (offset === 1) {
			return 'Last month'
		}

		return formatDate(start.getTime(), 'MMMM YYYY')
	}

	if (offset === 0) {
		return 'This year'
	}

	if (offset === 1) {
		return 'Last year'
	}

	return formatDate(start.getTime(), 'YYYY')
}

export const token_trend_config = {
	total_tokens: { label: 'Total tokens', color: '#f59e0b' },
	input_tokens: { label: 'Input', color: '#38bdf8' },
	output_tokens: { label: 'Output', color: '#34d399' },
	reasoning_tokens: { label: 'Reasoning', color: '#f97316' }
} satisfies ChartConfig

export const activity_trend_config = {
	messages: { label: 'Messages', color: '#6366f1' },
	new_posts: { label: 'Posts', color: '#10b981' },
	new_sessions: { label: 'Sessions', color: '#607D8B' },
	rewire_events: { label: 'Rewires', color: '#f43f5e' }
} satisfies ChartConfig
export { home_stats_period_items }
export { home_report_period_items }

@injectable()
export default class Index {
	loading = false
	snapshot = null as HomeSnapshot | null
	last_loaded_at = 0
	stats_period: HomeStatsPeriod = 'week'
	report_period: HomeReportPeriod = 'day'
	refresh_request_id = 0
	report_window_offset = 0
	report_loading = false
	report_error = ''
	report_data = null as HomeGeneratedReport | null
	report_status = null as HomeReportStatus | null
	report_request_id = 0
	report_trigger_loading = false
	report_watch_unsubscribe = null as null | (() => void)

	constructor(public global: GlobalModel) {
		makeAutoObservable(this, { global: false }, { autoBind: true })
	}

	get data() {
		return this.snapshot
	}

	get pthink_config() {
		return this.global.setting.config?.pthink
	}

	get pthink_enabled() {
		return Boolean(this.pthink_config?.enabled)
	}

	get pthink_idle_mins() {
		return Math.round((this.pthink_config?.idle_grace_ms ?? 20 * 60 * 1000) / 60000)
	}

	get pthink_weekly_day() {
		return weekday_label_map[this.pthink_config?.weekly_report_weekday ?? 'sun']
	}

	get pthink_last_label() {
		const last_summary = this.data?.pthink.status.last_summary

		if (last_summary?.created_at && last_summary.title) {
			return `${last_summary.title} · ${fromNow(last_summary.created_at)}`
		}

		return 'No report generated yet'
	}

	get pthink_runtime_label() {
		const status = this.data?.pthink.status

		if (!status) {
			return 'Runtime status unavailable'
		}

		const detail: string[] = [status.last_status]

		if (status.last_reason) {
			detail.push(status.last_reason)
		}

		if (status.last_error) {
			detail.push(status.last_error)
		}

		return `Runtime status: ${detail.join(' · ')}`
	}

	get last_loaded_label() {
		return this.last_loaded_at ? formatDateTime(this.last_loaded_at, 'YYYY-MM-DD HH:mm') : 'not loaded'
	}

	get stats_period_title() {
		return stats_period_title_map[this.stats_period]
	}

	get stats_period_window() {
		return stats_period_window_map[this.stats_period]
	}

	get stats_period_adjective() {
		return stats_period_adjective_map[this.stats_period]
	}

	setStatsPeriod(period: HomeStatsPeriod) {
		if (period === this.stats_period) {
			return
		}

		this.stats_period = period
		void this.refresh(period)
	}

	get report_window_start() {
		return getReportWindowStart(this.report_period, this.report_window_offset)
	}

	get report_window_end() {
		return getReportWindowEnd(this.report_period, this.report_window_start)
	}

	get report_window_label() {
		return (
			this.report_data?.window.label ||
			formatReportWindowLabel(
				this.report_period,
				this.report_window_offset,
				this.report_window_start,
				this.report_window_end
			)
		)
	}

	get can_move_to_prev_report_window() {
		return true
	}

	get can_move_to_next_report_window() {
		return this.report_window_offset > 0
	}

	setReportPeriod(period: HomeReportPeriod) {
		if (period === this.report_period) {
			return
		}

		this.report_period = period
		this.report_window_offset = 0
		void this.loadReport()
	}

	setReportWindowOffset(offset: number) {
		const next_offset = Math.max(0, Math.floor(offset))

		if (next_offset === this.report_window_offset) {
			return
		}

		this.report_window_offset = next_offset
		void this.loadReport()
	}

	moveToPrevReportWindow() {
		if (!this.can_move_to_prev_report_window) {
			return
		}

		this.setReportWindowOffset(this.report_window_offset + 1)
	}

	moveToNextReportWindow() {
		if (!this.can_move_to_next_report_window) {
			return
		}

		this.setReportWindowOffset(this.report_window_offset - 1)
	}

	get report_content() {
		return this.report_data?.content || ''
	}

	get report_exists() {
		return Boolean(this.report_data?.exists)
	}

	get report_path() {
		return this.report_data?.path || ''
	}

	get report_updated_label() {
		const value = this.report_data?.updated_at ?? 0

		return value ? formatDateTime(value, 'YYYY-MM-DD HH:mm:ss') : 'not generated'
	}

	get report_action_loading() {
		return this.report_trigger_loading || Boolean(this.report_status?.running)
	}

	get report_action_label() {
		return this.report_status_matches_current_window && this.report_action_loading ? 'Reporting' : 'Report'
	}

	get report_status_detail() {
		if (this.report_status_matches_current_window && this.report_status?.running) {
			return this.report_status.detail || 'Report generation is running in the background.'
		}

		if (this.report_status?.running) {
			return `Another report window is being processed in the background: ${this.report_status.label || this.report_status.key}.`
		}

		if (this.report_status?.error) {
			return this.report_status.error
		}

		return this.report_exists
			? `Stored at ${this.report_path}`
			: 'No report file has been generated for this window yet.'
	}

	get report_plan_path() {
		return this.report_status_matches_current_window ? this.report_status?.plan_path || '' : ''
	}

	get report_status_matches_current_window() {
		const current_key = this.report_data?.window.key || ''

		return (
			Boolean(this.report_status?.period) &&
			this.report_status?.period === this.report_period &&
			(!current_key || this.report_status?.key === current_key)
		)
	}

	async loadReport() {
		const request_id = ++this.report_request_id

		this.report_loading = true
		this.report_error = ''

		try {
			const response = await rpc.report.query.query({
				period: this.report_period,
				offset: this.report_window_offset
			})

			if (request_id !== this.report_request_id) {
				return
			}

			this.report_data = response
			this.report_status = response.status
		} catch (error) {
			if (request_id !== this.report_request_id) {
				return
			}

			this.report_error = error instanceof Error ? error.message : 'Failed to load report.'
			this.report_data = null
		} finally {
			if (request_id === this.report_request_id) {
				this.report_loading = false
			}
		}
	}

	async triggerReport() {
		if (this.report_action_loading) {
			return
		}

		this.report_trigger_loading = true
		this.report_status = {
			...(this.report_status || {
				running: false,
				period: this.report_period,
				key: this.report_data?.window.key || '',
				label: this.report_window_label,
				stage: 'preparing',
				detail: '',
				progress: 0,
				error: '',
				report_path: this.report_path,
				plan_path: '',
				updated_at: Date.now(),
				last_completed_at: 0
			}),
			running: true,
			period: this.report_period,
			key: this.report_data?.window.key || '',
			label: this.report_window_label,
			stage: 'preparing',
			detail: 'Submitting background report job',
			progress: 0.05,
			error: '',
			updated_at: Date.now()
		}

		try {
			this.report_status = await rpc.report.trigger.mutate({
				period: this.report_period,
				offset: this.report_window_offset
			})
		} finally {
			this.report_trigger_loading = false
		}
	}

	watchReportStatus() {
		const deinit = rpc.report.watch.subscribe(undefined, {
			onData: response => {
				this.report_status = response

				const current_key = this.report_data?.window.key || ''
				const is_current_window =
					response.period === this.report_period && (!current_key || response.key === current_key)

				if (is_current_window && (response.stage === 'writing' || !response.running)) {
					void this.loadReport()
				}
			}
		})

		this.report_watch_unsubscribe = deinit.unsubscribe
	}

	get overview_cards(): Array<HomeOverviewCard> {
		if (!this.data) {
			return []
		}

		const post_counts = this.data.content.post_for_counts
		const graph_total = this.data.memory.node_total + this.data.memory.edge_total
		const graph_week_total = this.data.memory.node_week_total + this.data.memory.edge_week_total

		return [
			{
				key: 'sessions',
				title: 'Sessions',
				value: formatInteger(this.data.overview.sessions_week),
				desc:
					this.stats_period === 'day'
						? `${formatCompact(this.data.overview.session_total)} total · ${this.data.overview.sessions_running} running now`
						: `${formatCompact(this.data.overview.session_total)} total · ${this.data.overview.sessions_running} running now · ${this.data.overview.sessions_today} created today`
			},
			{
				key: 'messages',
				title: 'Messages',
				value: formatCompact(this.data.overview.messages_week),
				desc:
					this.stats_period === 'day'
						? `${formatCompact(this.data.overview.message_total)} total`
						: `${formatCompact(this.data.overview.message_total)} total · ${formatCompact(this.data.overview.messages_today)} today`
			},
			{
				key: 'running',
				title: 'Active sessions',
				value: formatInteger(this.data.overview.sessions_with_messages_week),
				desc: this.session_recency_mix
			},
			{
				key: 'unread',
				title: 'Unread now',
				value: formatInteger(this.data.overview.sessions_unread),
				desc: `${this.data.overview.stale_unread_sessions_24h} stale 24h · ${this.data.overview.stale_unread_sessions_72h} stale 72h`
			},

			{
				key: 'tokens',
				title: 'Tokens',
				value: formatCompact(this.data.usage.period_total_tokens),
				desc: `${formatCompact(this.data.usage.total_tokens)} total · ${formatCompact(this.data.usage.avg_period_total_tokens_per_reply)} per reply`
			},
			{
				key: 'posts',
				title: 'Posts',
				value: formatInteger(this.data.activity.week.posts),
				desc: `${formatCompact(this.data.content.post_total)} total · ${post_counts.user} user · ${post_counts.wiki} wiki · ${post_counts.memory} memory`
			},
			{
				key: 'pipeline',
				title: 'Pipeline',
				value: `+${formatInteger(this.data.content.pipeline_created_week_total)}`,
				desc: `${this.data.health.backlog_pending_total} queued now`
			},
			{
				key: 'graph',
				title: 'Graph',
				value: `+${formatCompact(graph_week_total)}`,
				desc: `${formatCompact(graph_total)} total · +${this.data.memory.node_week_total} nodes · +${this.data.memory.edge_week_total} edges ${this.stats_period_window}`
			}
		]
	}

	get trends(): Array<HomeTrendPoint> {
		return this.data?.trends ? toJS(this.data.trends) : []
	}

	get token_trend_summary() {
		if (!this.data) {
			return ''
		}

		return `Last 14 days · ${formatCompact(this.data.usage.total_tokens)} tokens · ${this.data.usage.assistant_messages} assistant replies`
	}

	get activity_trend_summary() {
		if (!this.data) {
			return ''
		}

		const totals = this.trends.reduce(
			(acc, item) => {
				acc.messages += item.messages
				acc.sessions += item.new_sessions
				acc.posts += item.new_posts
				acc.rewire += item.rewire_events

				return acc
			},
			{ messages: 0, sessions: 0, posts: 0, rewire: 0 }
		)

		return `Last 14 days · ${totals.messages.toLocaleString('en-US')} messages · ${totals.sessions.toLocaleString('en-US')} sessions · ${totals.posts.toLocaleString('en-US')} posts · ${totals.rewire.toLocaleString('en-US')} rewires`
	}

	get activity_heatmap_cells(): Array<HomeHeatmapCell> {
		if (!this.data?.activity_heatmap) {
			return []
		}

		const base = toJS(this.data.activity_heatmap).map(item => ({
			...item,
			score: getHeatmapScore(item)
		}))
		const non_zero_scores = base
			.map(item => item.score)
			.filter(score => score > 0)
			.sort((left, right) => left - right)
		const thresholds = [
			getQuantile(non_zero_scores, 0.25),
			getQuantile(non_zero_scores, 0.5),
			getQuantile(non_zero_scores, 0.75)
		]

		return base.map(item => {
			const level =
				item.score <= 0
					? 0
					: item.score <= thresholds[0]
						? 1
						: item.score <= thresholds[1]
							? 2
							: item.score <= thresholds[2]
								? 3
								: 4
			const parts = [
				`${item.messages} messages`,
				`${item.new_sessions} sessions`,
				`${item.new_posts} posts`,
				`${item.rewire_events} rewires`,
				`${item.pthink_reports} reports`
			]

			return {
				...item,
				level,
				tooltip: `${formatDate(item.date, 'MMM D, YYYY')} · ${item.score} hotspot score · ${parts.join(' · ')}`
			}
		})
	}

	get activity_heatmap_summary() {
		const cells = this.activity_heatmap_cells

		if (cells.length === 0) {
			return ''
		}

		const active_days = cells.filter(item => item.score > 0).length
		const busiest_day = cells.reduce((best, item) => (item.score > best.score ? item : best), cells[0]!)

		return `Last 48 weeks · ${active_days} active days · busiest ${formatDate(busiest_day.date, 'MMM D')} at ${busiest_day.score}`
	}

	get usage_metrics(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{ key: 'total', title: 'Total', value: formatCompact(this.data.usage.period_total_tokens) },
			{ key: 'input', title: 'Input', value: formatCompact(this.data.usage.period_input_tokens) },
			{ key: 'output', title: 'Output', value: formatCompact(this.data.usage.period_output_tokens) },
			{
				key: 'reasoning',
				title: 'Reasoning',
				value: formatCompact(this.data.usage.period_reasoning_tokens)
			}
		]
	}

	get top_models() {
		return (this.data?.usage.models ?? []).map(item => ({
			key: item.key,
			title: item.label,
			subtitle: `${item.calls} calls · source ${item.source}`,
			value: formatCompact(item.total_tokens),
			meta: 'tokens'
		}))
	}

	get top_providers() {
		return (this.data?.usage.providers ?? []).map(item => ({
			key: item.provider,
			title: item.provider,
			subtitle: `${item.calls} calls`,
			value: formatCompact(item.total_tokens)
		}))
	}

	get session_recency_mix() {
		if (!this.data) {
			return ''
		}

		return `24h ${this.data.overview.sessions_active_24h} · 72h ${this.data.overview.sessions_warm_72h} · 7d ${this.data.overview.sessions_cooling_week} · dormant ${this.data.overview.sessions_dormant_over_week}`
	}

	get usage_depth_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		const top_model = this.data.usage.models[0]
		const top_provider = this.data.usage.providers[0]
		const top_model_share =
			this.data.usage.period_total_tokens > 0 && top_model
				? (top_model.total_tokens / this.data.usage.period_total_tokens) * 100
				: 0
		const top_provider_share =
			this.data.usage.period_total_tokens > 0 && top_provider
				? (top_provider.total_tokens / this.data.usage.period_total_tokens) * 100
				: 0
		const cached_ratio =
			this.data.usage.period_input_tokens > 0
				? (this.data.usage.period_cached_input_tokens / this.data.usage.period_input_tokens) * 100
				: 0
		const reasoning_share =
			this.data.usage.period_total_tokens > 0
				? (this.data.usage.period_reasoning_tokens / this.data.usage.period_total_tokens) * 100
				: 0

		return [
			{
				key: 'top-model-share',
				title: 'Top model share',
				value: formatPercent(top_model_share),
				desc: top_model
					? `${top_model.label}`
					: `No ${this.stats_period_adjective.toLowerCase()} model activity`
			},
			{
				key: 'top-provider-share',
				title: 'Provider concentration',
				value: formatPercent(top_provider_share),
				desc: top_provider
					? `${top_provider.provider} · ${top_provider.calls} calls`
					: 'No provider activity'
			},
			{
				key: 'cached-ratio',
				title: 'Cached input ratio',
				value: formatPercent(cached_ratio),
				desc: `${formatCompact(this.data.usage.period_cached_input_tokens)} cached of ${formatCompact(this.data.usage.period_input_tokens)} input tokens`
			},
			{
				key: 'reasoning-share',
				title: 'Reasoning share',
				value: formatPercent(reasoning_share),
				desc: `${formatCompact(this.data.usage.period_reasoning_tokens)} reasoning of ${formatCompact(this.data.usage.period_total_tokens)} total tokens`
			}
		]
	}

	get asset_depth_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		const session_grounding_week =
			this.data.activity.week.posts > 0
				? (this.data.content.posts_week_with_session / this.data.activity.week.posts) * 100
				: 0
		const project_tagging_week =
			this.data.activity.week.posts > 0
				? (this.data.content.posts_week_with_project / this.data.activity.week.posts) * 100
				: 0
		const intake_to_output =
			this.data.content.intake_week_total > 0
				? this.data.activity.week.posts / this.data.content.intake_week_total
				: this.data.activity.week.posts > 0
					? this.data.activity.week.posts
					: 0
		const active_agent_share =
			this.data.system.agent_total > 0
				? (this.data.system.agents_active_week / this.data.system.agent_total) * 100
				: 0

		return [
			{
				key: 'grounding',
				title: 'Session-grounded posts',
				value: formatPercent(session_grounding_week),
				desc: `${this.data.content.posts_week_with_session}/${this.data.activity.week.posts} ${this.stats_period_window} · ${this.data.content.posts_with_session_total}/${this.data.content.post_total} total`
			},
			{
				key: 'project-tagging',
				title: 'Project-tagged posts',
				value: formatPercent(project_tagging_week),
				desc: `${this.data.content.posts_week_with_project}/${this.data.activity.week.posts} ${this.stats_period_window} · ${this.data.content.posts_with_project_total}/${this.data.content.post_total} total`
			},
			{
				key: 'intake-output',
				title: 'Intake to output',
				value: formatRatio(intake_to_output),
				desc: `${this.data.activity.week.posts} posts from ${this.data.content.intake_week_total} new docs/articles/links ${this.stats_period_window}`
			},
			{
				key: 'agent-coverage',
				title: 'Active agent coverage',
				value: formatPercent(active_agent_share),
				desc: `${this.data.system.agents_active_week}/${this.data.system.agent_total} active ${this.stats_period_window} · ${this.data.system.agents_with_content_total}/${this.data.system.agent_total} with content`
			}
		]
	}

	get posts_total() {
		if (!this.data) {
			return '0'
		}

		return formatCompact(this.data.content.post_total)
	}

	get posts_meta() {
		if (!this.data) {
			return ''
		}

		const counts = this.data.content.post_for_counts

		return joinNonZeroMeta([
			[counts.user, `User ${counts.user}`],
			[counts.wiki, `Wiki ${counts.wiki}`],
			[counts.memory, `Memory ${counts.memory}`]
		])
	}

	get pipeline_total() {
		return this.data ? formatCompact(this.data.health.backlog_pending_total) : '0'
	}

	get linkcase_total() {
		return this.data ? formatCompact(this.data.content.link_total) : '0'
	}

	get linkcase_meta() {
		return this.data
			? joinNonZeroMeta([
					[this.data.content.link_ready_total, 'ready'],
					[this.data.content.link_pending_total, 'waiting'],
					[this.data.content.link_fail_total, 'failed']
				])
			: ''
	}

	get asset_health_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'docs',
				title: 'Docs/Articles/Chunks',
				value: `${formatCompact(this.data.content.document_total)}/${formatCompact(this.data.content.article_total)}/${formatCompact(this.data.content.chunk_total)}`,
				desc: `${this.data.content.avg_chunks_per_article} avg chunks per article`
			},
			{
				key: 'completion',
				title: 'Post completion',
				value: formatPercent(this.data.content.post_completion_rate),
				desc: `${this.data.content.posts_ready_total} ready · ${this.data.content.posts_pending} pending`
			}
		]
	}

	get ops_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'notifications',
				title: 'Unread notifications',
				value: String(this.data.system.notification_unread)
			},
			{
				key: 'peers',
				title: 'Connected peers',
				value: String(this.data.system.im_peer_total)
			},
			{
				key: 'accounts',
				title: 'Enabled IM accounts',
				value: `${this.data.system.im_account_enabled}/${this.data.system.im_account_total}`
			},
			{
				key: 'delivery',
				title: 'Push delivery',
				value: formatPercent(this.data.health.notification_push_rate)
			}
		]
	}

	get node_total_label() {
		return this.data ? formatInteger(this.data.memory.node_total) : '0'
	}

	get edge_total_label() {
		return this.data ? formatInteger(this.data.memory.edge_total) : '0'
	}

	get memory_health_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'growth',
				title: `${this.stats_period_adjective} growth`,
				value: `+${this.data.memory.node_week_total}/+${this.data.memory.edge_week_total}`,
				desc: `Nodes/edges created ${this.stats_period_window}`
			},
			{
				key: 'state',
				title: 'Silent/unstable edges',
				value: `${this.data.memory.silent_edge_total}/${this.data.memory.unstable_edge_total}`,
				desc: `${formatPercent(this.data.memory.unstable_edge_ratio)} unstable ratio`
			},
			{
				key: 'stability',
				title: 'Average stability',
				value: String(this.data.memory.avg_edge_stability),
				desc: `Average rewire score ${this.data.memory.avg_edge_rewire_score}`
			}
		]
	}

	get memory_depth_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		const frozen_total = this.data.memory.frozen_node_total + this.data.memory.frozen_edge_total
		const graph_total = this.data.memory.node_total + this.data.memory.edge_total
		const active_edge_share =
			this.data.memory.edge_total > 0
				? (this.data.memory.active_edge_total / this.data.memory.edge_total) * 100
				: 0
		const rewire_intensity =
			this.data.memory.edge_total > 0
				? (this.data.memory.rewire_event_week / this.data.memory.edge_total) * 100
				: 0
		const freeze_ratio = graph_total > 0 ? (frozen_total / graph_total) * 100 : 0

		return [
			{
				key: 'rewire-intensity',
				title: 'Rewire intensity',
				value: formatPercent(rewire_intensity),
				desc: `${this.data.memory.rewire_event_week} rewires ${this.stats_period_window} across ${formatCompact(this.data.memory.edge_total)} total edges`
			},
			{
				key: 'active-edge-share',
				title: 'Active edge share',
				value: formatPercent(active_edge_share),
				desc: `${this.data.memory.active_edge_total} active · ${this.data.memory.silent_edge_total} silent`
			},
			{
				key: 'freeze-ratio',
				title: 'Frozen ratio',
				value: formatPercent(freeze_ratio),
				desc: `${frozen_total.toLocaleString('en-US')} frozen nodes and edges combined`
			}
		]
	}

	get activity_window_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		const primary_item = {
			key: this.stats_period,
			title: this.stats_period_title,
			value: `${this.data.activity.week.messages} messages`,
			desc: `${this.data.activity.week.sessions} sessions · ${this.data.activity.week.posts} posts · ${formatCompact(this.data.activity.week.tokens)} tokens`
		}
		const comparison_item =
			this.stats_period === 'day'
				? {
						key: 'total',
						title: 'All time',
						value: `${this.data.overview.message_total} messages`,
						desc: `${this.data.overview.session_total} sessions · ${this.data.content.post_total} posts · ${formatCompact(this.data.usage.total_tokens)} tokens`
					}
				: {
						key: 'today',
						title: 'Today',
						value: `${this.data.activity.today.messages} messages`,
						desc: `${this.data.activity.today.sessions} sessions · ${this.data.activity.today.posts} posts · ${formatCompact(this.data.activity.today.tokens)} tokens`
					}

		return [primary_item, comparison_item]
	}

	get pthink_alert_label() {
		if (!this.data?.health.top_alert) {
			return this.data?.health.has_meaningful_recent_activity
				? 'Meaningful activity detected'
				: 'No alert signal'
		}

		return `${this.data.health.top_alert.label} · ${this.data.health.top_alert.detail}`
	}

	get pthink_runtime_items(): Array<HomeRuntimeItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'reports',
				title: 'Reports',
				value: `${this.data.pthink.report_today} / ${this.data.pthink.report_week} / ${this.data.pthink.report_total} (day / period / total)`
			},
			{
				key: 'trigger',
				title: 'Trigger Mode',
				value: this.pthink_config?.trigger_enabled
					? `enabled · ${this.data.health.top_alert?.label ?? 'no active alert'}`
					: 'disabled'
			},
			{
				key: 'cap',
				title: 'Daily Cap',
				value: String(this.pthink_config?.max_reports_per_day ?? 3)
			},
			{
				key: 'last-report',
				title: 'Last Report',
				value: this.pthink_last_label
			},
			{
				key: 'refresh',
				title: 'Snapshot Refresh',
				value: this.last_loaded_label
			}
		]
	}

	get pthink_depth_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		const week_counts = this.data.pthink.kind_counts_week
		const total_counts = this.data.pthink.kind_counts_total
		const week_total = week_counts.idle + week_counts.daily + week_counts.weekly + week_counts.trigger
		const trigger_share = week_total > 0 ? (week_counts.trigger / week_total) * 100 : 0
		const scheduled_week = week_counts.idle + week_counts.daily + week_counts.weekly
		const last_report_gap_hours = this.data.pthink.status.last_report_at
			? Math.max(0, Math.round((Date.now() - this.data.pthink.status.last_report_at) / (60 * 60 * 1000)))
			: null

		return [
			{
				key: 'trigger-share',
				title: 'Trigger share',
				value: formatPercent(trigger_share),
				desc: `${week_counts.trigger} trigger · ${scheduled_week} scheduled reports ${this.stats_period_window}`
			},
			{
				key: 'report-gap',
				title: 'Last report gap',
				value: last_report_gap_hours === null ? 'None' : `${last_report_gap_hours}h`,
				desc: this.data.pthink.status.last_report_at
					? `${this.data.pthink.status.last_status} · last report ${fromNow(this.data.pthink.status.last_report_at)}`
					: 'No autonomous report generated yet'
			},
			{
				key: 'report-mix',
				title: 'Report mix',
				value: `${week_counts.daily}/${week_counts.weekly}/${week_counts.trigger}/${week_counts.idle}`,
				desc: `Daily / weekly / trigger / idle ${this.stats_period_window} · ${total_counts.trigger} trigger total`
			}
		]
	}

	init() {
		void this.refresh()
		void this.loadReport()
		this.watchReportStatus()
	}

	async refresh(period = this.stats_period) {
		const request_id = ++this.refresh_request_id

		this.loading = true

		try {
			const snapshot = await rpc.home.query.query({ period })

			if (request_id !== this.refresh_request_id) {
				return
			}

			this.snapshot = snapshot
			this.last_loaded_at = Date.now()
		} finally {
			if (request_id === this.refresh_request_id) {
				this.loading = false
			}
		}
	}

	deinit() {
		this.report_watch_unsubscribe?.()
		this.report_watch_unsubscribe = null
	}
}

import { makeAutoObservable, toJS } from 'mobx'
import { injectable } from 'tsyringe'

import GlobalModel from '@/models/global'
import { formatDate, formatDateTime, fromNow, rpc } from '@/utils'

import type { ChartConfig } from '@/__shadcn__/components/ui/chart'
import type {
	HomeGeneratedReport,
	HomeHeatmapCell,
	HomeLeaderboardItem,
	HomeModelItem,
	HomeOverviewCard,
	HomeReportPeriod,
	HomeReportStatus,
	HomeRuntimeItem,
	HomeSnapshot,
	HomeStatsPeriod,
	HomeTrendPoint
} from './types'

const compact_formatter = Intl.NumberFormat(navigator.language, { notation: 'compact', maximumFractionDigits: 1 })
const t_home = (key: string, options?: Record<string, unknown>) =>
	$t(key as never, { ns: 'home', ...(options || {}) }) as string

const stats_period_options = ['week', 'day', 'month', 'year', 'total'] as const
const getStatsPeriodTitle = (value: HomeStatsPeriod) => $t(`period.title.${value}`, { ns: 'home' })
const getStatsPeriodWindow = (value: HomeStatsPeriod) => t_home(`period.window.${value}`)
const getStatsPeriodAdjective = (value: HomeStatsPeriod) => t_home(`period.adjective.${value}`)

const getHomeStatsPeriodItems = () =>
	stats_period_options.map(value => ({
		value,
		label: getStatsPeriodTitle(value)
	}))

const getHomeReportPeriodItems = () =>
	getHomeStatsPeriodItems().filter(item => item.value !== 'total') as Array<{
		value: HomeReportPeriod
		label: string
	}>

const formatCompact = (value: number) => compact_formatter.format(value)
const formatInteger = (value: number) => value.toLocaleString(navigator.language)
const formatPercent = (value: number) => `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`
const formatRatio = (value: number) => `${value.toFixed(value >= 10 ? 0 : 1)}x`
const toPhoto = (value: unknown) => value as Uint8Array | null
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

const getReportWindowEnd = (period: HomeReportPeriod, start: Date) => {
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
	}
}

const formatReportWindowLabel = (period: HomeReportPeriod, offset: number, start: Date, end: Date | null) => {
	if (period === 'day') {
		if (offset === 0) {
			return t_home('period.relative.today')
		}

		if (offset === 1) {
			return t_home('period.relative.yesterday')
		}

		return formatDate(start.getTime(), 'MMM D, YYYY')
	}

	if (period === 'week') {
		if (offset === 0) {
			return t_home('period.relative.this_week')
		}

		if (offset === 1) {
			return t_home('period.relative.last_week')
		}

		const end_label = end ? formatDate(end.getTime() - 1, 'MMM D') : ''

		return `${formatDate(start.getTime(), 'MMM D')} - ${end_label}`
	}

	if (period === 'month') {
		if (offset === 0) {
			return t_home('period.relative.this_month')
		}

		if (offset === 1) {
			return t_home('period.relative.last_month')
		}

		return formatDate(start.getTime(), 'MMMM YYYY')
	}

	if (offset === 0) {
		return t_home('period.relative.this_year')
	}

	if (offset === 1) {
		return t_home('period.relative.last_year')
	}

	return formatDate(start.getTime(), 'YYYY')
}

export const getTokenTrendConfig = () =>
	({
		total_tokens: { label: t_home('model.total'), color: '#f59e0b' },
		input_tokens: { label: t_home('model.input'), color: '#38bdf8' },
		output_tokens: { label: t_home('model.output'), color: '#34d399' },
		reasoning_tokens: { label: t_home('model.reasoning'), color: '#f97316' }
	}) satisfies ChartConfig

export const getActivityTrendConfig = () =>
	({
		messages: { label: t_home('model.messages'), color: '#6366f1' },
		new_posts: { label: t_home('model.posts'), color: '#10b981' },
		new_sessions: { label: t_home('model.sessions'), color: '#607D8B' },
		rewire_events: { label: t_home('model.rewires'), color: '#f43f5e' }
	}) satisfies ChartConfig
export { getHomeStatsPeriodItems }
export { getHomeReportPeriodItems }

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

	get report_config() {
		return this.global.setting.config?.report
	}

	get report_enabled() {
		return this.report_config?.enabled !== false
	}

	get pthink_enabled() {
		return Boolean(this.pthink_config?.enabled)
	}

	get pthink_idle_mins() {
		return Math.round((this.pthink_config?.idle_grace_ms ?? 20 * 60 * 1000) / 60000)
	}

	get pthink_last_label() {
		const last_summary = this.data?.pthink.status.last_summary

		if (last_summary?.created_at && last_summary.title) {
			return `${last_summary.title} · ${fromNow(last_summary.created_at)}`
		}

		return $t('model.no_review_generated', { ns: 'home' })
	}

	get pthink_runtime_label() {
		const status = this.data?.pthink.status

		if (!status) {
			return $t('model.runtime_status_unavailable', { ns: 'home' })
		}

		const detail: string[] = [status.last_status]

		if (status.last_reason) {
			detail.push(status.last_reason)
		}

		if (status.last_error) {
			detail.push(status.last_error)
		}

		return $t('model.runtime_status', { ns: 'home', detail: detail.join(' · ') })
	}

	get last_loaded_label() {
		return this.last_loaded_at
			? formatDateTime(this.last_loaded_at, 'YYYY-MM-DD HH:mm')
			: $t('model.not_loaded', { ns: 'home' })
	}

	get stats_period_title() {
		return getStatsPeriodTitle(this.stats_period)
	}

	get stats_period_window() {
		return getStatsPeriodWindow(this.stats_period)
	}

	get stats_period_adjective() {
		return getStatsPeriodAdjective(this.stats_period)
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

		return value ? formatDateTime(value, 'YYYY-MM-DD HH:mm:ss') : $t('model.not_generated', { ns: 'home' })
	}

	get report_action_loading() {
		return this.report_trigger_loading || Boolean(this.report_status?.running)
	}

	get report_action_label() {
		return this.report_status_matches_current_window && this.report_action_loading
			? $t('model.reporting', { ns: 'home' })
			: $t('model.report', { ns: 'home' })
	}

	get report_status_detail() {
		if (!this.report_enabled) {
			return $t('model.report_disabled', { ns: 'home' })
		}

		if (this.report_status_matches_current_window && this.report_status?.running) {
			return this.report_status.detail || $t('model.report_running_background', { ns: 'home' })
		}

		if (this.report_status?.running) {
			return $t('model.report_other_window', {
				ns: 'home',
				label: this.report_status.label || this.report_status.key
			})
		}

		if (this.report_status?.error) {
			return this.report_status.error
		}

		return this.report_exists
			? $t('model.report_stored_at', { ns: 'home', path: this.report_path })
			: $t('model.report_missing_file', { ns: 'home' })
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

			this.report_error =
				error instanceof Error ? error.message : $t('model.failed_load_report', { ns: 'home' })
			this.report_data = null
		} finally {
			if (request_id === this.report_request_id) {
				this.report_loading = false
			}
		}
	}

	async triggerReport() {
		if (!this.report_enabled || this.report_action_loading) {
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
			detail: $t('model.submitting_background_job', { ns: 'home' }),
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
				title: $t('model.sessions', { ns: 'home' }),
				value: formatInteger(this.data.overview.sessions_week),
				desc:
					this.stats_period === 'day'
						? t_home('summary.sessions_total_running', {
								total: formatCompact(this.data.overview.session_total),
								running: this.data.overview.sessions_running
							})
						: t_home('summary.sessions_total_running_created', {
								total: formatCompact(this.data.overview.session_total),
								running: this.data.overview.sessions_running,
								today: this.data.overview.sessions_today
							})
			},
			{
				key: 'messages',
				title: t_home('model.messages'),
				value: formatCompact(this.data.overview.messages_week),
				desc:
					this.stats_period === 'day'
						? t_home('summary.messages_total', {
								total: formatCompact(this.data.overview.message_total)
							})
						: t_home('summary.messages_total_today', {
								total: formatCompact(this.data.overview.message_total),
								today: formatCompact(this.data.overview.messages_today)
							})
			},
			{
				key: 'running',
				title: $t('model.active_sessions', { ns: 'home' }),
				value: formatInteger(this.data.overview.sessions_with_messages_week),
				desc: this.session_recency_mix
			},
			{
				key: 'unread',
				title: $t('model.unread_now', { ns: 'home' }),
				value: formatInteger(this.data.overview.sessions_unread),
				desc: t_home('summary.stale_unread_mix', {
					stale_24h: this.data.overview.stale_unread_sessions_24h,
					stale_72h: this.data.overview.stale_unread_sessions_72h
				})
			},

			{
				key: 'tokens',
				title: $t('model.tokens', { ns: 'home' }),
				value: formatCompact(this.data.usage.period_total_tokens),
				desc: t_home('summary.tokens_total_per_reply', {
					total: formatCompact(this.data.usage.total_tokens),
					per_reply: formatCompact(this.data.usage.avg_period_total_tokens_per_reply)
				})
			},
			{
				key: 'posts',
				title: $t('model.posts', { ns: 'home' }),
				value: formatInteger(this.data.activity.week.posts),
				desc: t_home('summary.posts_total_mix', {
					total: formatCompact(this.data.content.post_total),
					user: t_home('model.user_count', { count: post_counts.user }),
					wiki: t_home('model.wiki_count', { count: post_counts.wiki }),
					memory: t_home('model.memory_count', { count: post_counts.memory })
				})
			},
			{
				key: 'pipeline',
				title: $t('model.pipeline', { ns: 'home' }),
				value: `+${formatInteger(this.data.content.pipeline_created_week_total)}`,
				desc: t_home('summary.pipeline_queued_now', {
					count: this.data.health.backlog_pending_total
				})
			},
			{
				key: 'graph',
				title: $t('model.graph', { ns: 'home' }),
				value: `+${formatCompact(graph_week_total)}`,
				desc: t_home('summary.graph_growth_mix', {
					total: formatCompact(graph_total),
					nodes: this.data.memory.node_week_total,
					edges: this.data.memory.edge_week_total,
					window: this.stats_period_window
				})
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

		return t_home('summary.token_trend', {
			window: $t('model.last_14_days', { ns: 'home' }),
			total: formatCompact(this.data.usage.total_tokens),
			replies: this.data.usage.assistant_messages
		})
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

		return t_home('summary.activity_trend', {
			window: $t('model.last_14_days', { ns: 'home' }),
			messages: totals.messages.toLocaleString(navigator.language),
			sessions: totals.sessions.toLocaleString(navigator.language),
			posts: totals.posts.toLocaleString(navigator.language),
			rewires: totals.rewire.toLocaleString(navigator.language)
		})
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
				`${item.messages} ${t_home('model.messages').toLowerCase()}`,
				`${item.new_sessions} ${t_home('model.sessions').toLowerCase()}`,
				`${item.new_posts} ${t_home('model.posts').toLowerCase()}`,
				`${item.rewire_events} ${t_home('model.rewires').toLowerCase()}`,
				`${item.pthink_reports} ${t_home('model.reviews').toLowerCase()}`
			]

			return {
				...item,
				level,
				tooltip: `${formatDate(item.date, 'MMM D, YYYY')} · ${t_home('model.hotspot_score', { score: item.score })} · ${parts.join(' · ')}`
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

		return t_home('summary.heatmap', {
			window: t_home('model.last_48_weeks'),
			active_days,
			date: formatDate(busiest_day.date, 'MMM D'),
			score: busiest_day.score
		})
	}

	get usage_metrics(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'total',
				title: t_home('model.total'),
				value: formatCompact(this.data.usage.period_total_tokens)
			},
			{
				key: 'input',
				title: t_home('model.input'),
				value: formatCompact(this.data.usage.period_input_tokens)
			},
			{
				key: 'output',
				title: t_home('model.output'),
				value: formatCompact(this.data.usage.period_output_tokens)
			},
			{
				key: 'reasoning',
				title: t_home('model.reasoning'),
				value: formatCompact(this.data.usage.period_reasoning_tokens)
			}
		]
	}

	get top_models() {
		return (this.data?.usage.models ?? []).map(item => ({
			key: item.key,
			title: item.label,
			subtitle: t_home('summary.model_calls_source', {
				calls: item.calls,
				source: item.source
			}),
			value: formatCompact(item.total_tokens),
			meta: t_home('common.tokens')
		}))
	}

	get top_providers() {
		return (this.data?.usage.providers ?? []).map(item => ({
			key: item.provider,
			title: item.provider,
			subtitle: t_home('summary.provider_calls', { calls: item.calls }),
			value: formatCompact(item.total_tokens)
		}))
	}

	get session_recency_mix() {
		if (!this.data) {
			return ''
		}

		return t_home('summary.session_recency_mix', {
			hours_24: this.data.overview.sessions_active_24h,
			hours_72: this.data.overview.sessions_warm_72h,
			days_7: this.data.overview.sessions_cooling_week,
			dormant: this.data.overview.sessions_dormant_over_week
		})
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
				title: $t('model.top_model_share', { ns: 'home' }),
				value: formatPercent(top_model_share),
				desc: top_model
					? `${top_model.label}`
					: $t('model.no_model_activity', {
							ns: 'home',
							period: this.stats_period_adjective.toLowerCase()
						})
			},
			{
				key: 'top-provider-share',
				title: $t('model.provider_concentration', { ns: 'home' }),
				value: formatPercent(top_provider_share),
				desc: top_provider
					? t_home('summary.provider_calls_named', {
							provider: top_provider.provider,
							calls: top_provider.calls
						})
					: $t('model.no_provider_activity', { ns: 'home' })
			},
			{
				key: 'cached-ratio',
				title: $t('model.cached_input_ratio', { ns: 'home' }),
				value: formatPercent(cached_ratio),
				desc: t_home('summary.cached_of_input_tokens', {
					cached: formatCompact(this.data.usage.period_cached_input_tokens),
					input: formatCompact(this.data.usage.period_input_tokens)
				})
			},
			{
				key: 'reasoning-share',
				title: $t('model.reasoning_share', { ns: 'home' }),
				value: formatPercent(reasoning_share),
				desc: t_home('summary.reasoning_of_total_tokens', {
					reasoning: formatCompact(this.data.usage.period_reasoning_tokens),
					total: formatCompact(this.data.usage.period_total_tokens)
				})
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
				title: $t('model.session_grounded_posts', { ns: 'home' }),
				value: formatPercent(session_grounding_week),
				desc: t_home('summary.period_vs_total_ratio', {
					period_count: this.data.content.posts_week_with_session,
					period_total: this.data.activity.week.posts,
					window: this.stats_period_window,
					total_count: this.data.content.posts_with_session_total,
					total_total: this.data.content.post_total
				})
			},
			{
				key: 'project-tagging',
				title: $t('model.project_tagged_posts', { ns: 'home' }),
				value: formatPercent(project_tagging_week),
				desc: t_home('summary.period_vs_total_ratio', {
					period_count: this.data.content.posts_week_with_project,
					period_total: this.data.activity.week.posts,
					window: this.stats_period_window,
					total_count: this.data.content.posts_with_project_total,
					total_total: this.data.content.post_total
				})
			},
			{
				key: 'intake-output',
				title: $t('model.intake_to_output', { ns: 'home' }),
				value: formatRatio(intake_to_output),
				desc: t_home('summary.posts_from_intake', {
					posts: this.data.activity.week.posts,
					intake: this.data.content.intake_week_total,
					window: this.stats_period_window
				})
			},
			{
				key: 'agent-coverage',
				title: $t('model.active_agent_coverage', { ns: 'home' }),
				value: formatPercent(active_agent_share),
				desc: t_home('summary.active_with_content_mix', {
					active: this.data.system.agents_active_week,
					total: this.data.system.agent_total,
					window: this.stats_period_window,
					with_content: this.data.system.agents_with_content_total
				})
			}
		]
	}

	get agent_overview_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		const { summary } = this.data.agents
		const active_agent_share =
			this.data.system.agent_total > 0 ? (summary.active_agents / this.data.system.agent_total) * 100 : 0
		const active_group_share =
			this.data.system.group_total > 0 ? (summary.active_groups / this.data.system.group_total) * 100 : 0

		return [
			{
				key: 'active-agents',
				title: $t('model.active_agents', { ns: 'home' }),
				value: `${summary.active_agents}/${this.data.system.agent_total}`,
				desc: t_home('summary.with_messages_window', {
					value: formatPercent(active_agent_share),
					window: this.stats_period_window
				})
			},
			{
				key: 'linked-agents',
				title: $t('model.linked_agents', { ns: 'home' }),
				value: String(summary.agents_with_sessions_total),
				desc: t_home('summary.with_content_total', {
					with_content: summary.agents_with_content_total,
					total: this.data.system.agent_total
				})
			},
			{
				key: 'active-groups',
				title: $t('model.active_groups', { ns: 'home' }),
				value: `${summary.active_groups}/${this.data.system.group_total}`,
				desc: t_home('summary.with_messages_window', {
					value: formatPercent(active_group_share),
					window: this.stats_period_window
				})
			},
			{
				key: 'linked-groups',
				title: $t('model.linked_groups', { ns: 'home' }),
				value: String(summary.groups_with_sessions_total),
				desc: t_home('summary.staffed_total', {
					value: summary.groups_with_members_total,
					total: this.data.system.group_total
				})
			}
		]
	}

	get agent_activity_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		const { summary } = this.data.agents

		return [
			{
				key: 'agent-sessions',
				title: $t('model.agent_sessions', { ns: 'home' }),
				value: formatInteger(summary.agent_sessions_total),
				desc: t_home('summary.messages_window', {
					value: formatCompact(summary.period_messages_by_agents),
					window: this.stats_period_window
				})
			},
			{
				key: 'agent-tokens',
				title: $t('model.agent_tokens', { ns: 'home' }),
				value: formatCompact(summary.period_tokens_by_agents),
				desc: t_home('summary.messages_window', {
					value: formatCompact(summary.period_messages_by_agents),
					window: this.stats_period_window
				})
			},
			{
				key: 'group-sessions',
				title: $t('model.group_sessions', { ns: 'home' }),
				value: formatInteger(summary.group_sessions_total),
				desc: t_home('summary.messages_window', {
					value: formatCompact(summary.period_messages_by_groups),
					window: this.stats_period_window
				})
			},
			{
				key: 'group-tokens',
				title: $t('model.group_tokens', { ns: 'home' }),
				value: formatCompact(summary.period_tokens_by_groups),
				desc: t_home('summary.messages_window', {
					value: formatCompact(summary.period_messages_by_groups),
					window: this.stats_period_window
				})
			}
		]
	}

	get top_agent_items(): Array<HomeLeaderboardItem> {
		return (this.data?.agents.top_agents ?? []).map(item => ({
			key: item.id,
			title: item.name,
			subtitle: t_home('summary.top_agent_subtitle', {
				sessions: item.session_count,
				messages: item.message_count,
				replies: item.assistant_replies
			}),
			meta: t_home('summary.top_agent_meta', {
				posts: item.post_count,
				docs: item.document_count,
				articles: item.article_count
			}),
			value: formatCompact(item.total_tokens),
			photo: toPhoto(item.photo),
			avatar: item.avatar ?? null,
			footnote: item.last_active_at
				? $t('model.last_active', { ns: 'home', value: fromNow(item.last_active_at) })
				: $t('model.no_activity', {
						ns: 'home',
						period: this.stats_period_adjective.toLowerCase()
					})
		}))
	}

	get top_group_items(): Array<HomeLeaderboardItem> {
		return (this.data?.agents.top_groups ?? []).map(item => ({
			key: item.id,
			title: item.name,
			subtitle: t_home('summary.top_group_subtitle', {
				members: item.agent_count,
				sessions: item.session_count,
				messages: item.message_count
			}),
			meta: t_home('summary.top_group_meta', {
				replies: item.assistant_replies,
				sessions: item.session_total
			}),
			value: formatCompact(item.total_tokens),
			photo: toPhoto(item.photo),
			footnote: item.last_active_at
				? $t('model.last_active', { ns: 'home', value: fromNow(item.last_active_at) })
				: $t('model.no_activity', {
						ns: 'home',
						period: this.stats_period_adjective.toLowerCase()
					})
		}))
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
			[counts.user, $t('model.user_count', { ns: 'home', count: counts.user })],
			[counts.wiki, $t('model.wiki_count', { ns: 'home', count: counts.wiki })],
			[counts.memory, $t('model.memory_count', { ns: 'home', count: counts.memory })]
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
					[this.data.content.link_ready_total, $t('model.ready', { ns: 'home' })],
					[this.data.content.link_pending_total, $t('model.waiting', { ns: 'home' })],
					[this.data.content.link_fail_total, $t('model.failed', { ns: 'home' })]
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
				title: $t('model.docs_articles_chunks', { ns: 'home' }),
				value: `${formatCompact(this.data.content.document_total)}/${formatCompact(this.data.content.article_total)}/${formatCompact(this.data.content.chunk_total)}`,
				desc: $t('model.avg_chunks_per_article', {
					ns: 'home',
					count: this.data.content.avg_chunks_per_article
				})
			},
			{
				key: 'completion',
				title: $t('model.post_completion', { ns: 'home' }),
				value: formatPercent(this.data.content.post_completion_rate),
				desc: `${this.data.content.posts_ready_total} ${$t('model.ready', { ns: 'home' })} · ${$t(
					'model.pending',
					{
						ns: 'home',
						count: this.data.content.posts_pending
					}
				)}`
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
				title: $t('model.unread_notifications', { ns: 'home' }),
				value: String(this.data.system.notification_unread)
			},
			{
				key: 'peers',
				title: $t('model.connected_peers', { ns: 'home' }),
				value: String(this.data.system.im_peer_total)
			},
			{
				key: 'accounts',
				title: $t('model.enabled_im_accounts', { ns: 'home' }),
				value: `${this.data.system.im_account_enabled}/${this.data.system.im_account_total}`
			},
			{
				key: 'delivery',
				title: $t('model.push_delivery', { ns: 'home' }),
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
				title: $t('model.growth', { ns: 'home', period: this.stats_period_adjective }),
				value: `+${this.data.memory.node_week_total}/+${this.data.memory.edge_week_total}`,
				desc: $t('model.nodes_edges_created', { ns: 'home', window: this.stats_period_window })
			},
			{
				key: 'state',
				title: $t('model.silent_unstable_edges', { ns: 'home' }),
				value: `${this.data.memory.silent_edge_total}/${this.data.memory.unstable_edge_total}`,
				desc: $t('model.unstable_ratio', {
					ns: 'home',
					value: formatPercent(this.data.memory.unstable_edge_ratio)
				})
			},
			{
				key: 'stability',
				title: $t('model.average_stability', { ns: 'home' }),
				value: String(this.data.memory.avg_edge_stability),
				desc: $t('model.average_rewire_score', {
					ns: 'home',
					value: this.data.memory.avg_edge_rewire_score
				})
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
				title: $t('model.rewire_intensity', { ns: 'home' }),
				value: formatPercent(rewire_intensity),
				desc: $t('model.rewires_window', {
					ns: 'home',
					count: this.data.memory.rewire_event_week,
					window: this.stats_period_window,
					total: formatCompact(this.data.memory.edge_total)
				})
			},
			{
				key: 'active-edge-share',
				title: $t('model.active_edge_share', { ns: 'home' }),
				value: formatPercent(active_edge_share),
				desc: `${$t('model.active', { ns: 'home', count: this.data.memory.active_edge_total })} · ${$t(
					'model.silent',
					{
						ns: 'home',
						count: this.data.memory.silent_edge_total
					}
				)}`
			},
			{
				key: 'freeze-ratio',
				title: $t('model.frozen_ratio', { ns: 'home' }),
				value: formatPercent(freeze_ratio),
				desc: t_home('summary.frozen_nodes_edges_combined', {
					total: frozen_total.toLocaleString(navigator.language)
				})
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
			value: t_home('summary.window_messages', {
				value: this.data.activity.week.messages
			}),
			desc: t_home('summary.window_activity_desc', {
				sessions: this.data.activity.week.sessions,
				posts: this.data.activity.week.posts,
				tokens: formatCompact(this.data.activity.week.tokens)
			})
		}
		const comparison_item =
			this.stats_period === 'day'
				? {
						key: 'total',
						title: $t('model.all_time', { ns: 'home' }),
						value: t_home('summary.window_messages', {
							value: this.data.overview.message_total
						}),
						desc: t_home('summary.window_activity_desc', {
							sessions: this.data.overview.session_total,
							posts: this.data.content.post_total,
							tokens: formatCompact(this.data.usage.total_tokens)
						})
					}
				: {
						key: 'today',
						title: $t('period.title.day', { ns: 'home' }),
						value: t_home('summary.window_messages', {
							value: this.data.activity.today.messages
						}),
						desc: t_home('summary.window_activity_desc', {
							sessions: this.data.activity.today.sessions,
							posts: this.data.activity.today.posts,
							tokens: formatCompact(this.data.activity.today.tokens)
						})
					}

		return [primary_item, comparison_item]
	}

	get pthink_alert_label() {
		if (!this.data?.health.top_alert) {
			return this.data?.health.has_meaningful_recent_activity
				? $t('model.meaningful_activity_detected', { ns: 'home' })
				: $t('model.no_alert_signal', { ns: 'home' })
		}

		return `${this.data.health.top_alert.label} · ${this.data.health.top_alert.detail}`
	}

	get pthink_runtime_items(): Array<HomeRuntimeItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'reviews',
				title: $t('model.reviews', { ns: 'home' }),
				value: $t('model.reviews_day_period_total', {
					ns: 'home',
					day: this.data.pthink.report_today,
					period: this.data.pthink.report_week,
					total: this.data.pthink.report_total
				})
			},
			{
				key: 'skill-generation',
				title: $t('model.skill_generation', { ns: 'home' }),
				value:
					this.pthink_config?.skill_generation_enabled === false
						? $t('model.disabled', { ns: 'home' })
						: $t('model.enabled', { ns: 'home' })
			},
			{
				key: 'tool-generation',
				title: $t('model.tool_generation', { ns: 'home' }),
				value:
					this.pthink_config?.tool_generation_enabled === false
						? $t('model.disabled', { ns: 'home' })
						: $t('model.enabled', { ns: 'home' })
			},
			{
				key: 'last-review',
				title: $t('model.last_review', { ns: 'home' }),
				value: this.pthink_last_label
			},
			{
				key: 'refresh',
				title: $t('model.snapshot_refresh', { ns: 'home' }),
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
		const last_summary = this.data.pthink.status.last_summary
		const last_output_total =
			(last_summary?.article_ids.length ?? 0) +
			(last_summary?.skill_names.length ?? 0) +
			(last_summary?.tool_names.length ?? 0)
		const last_report_gap_hours = this.data.pthink.status.last_report_at
			? Math.max(0, Math.round((Date.now() - this.data.pthink.status.last_report_at) / (60 * 60 * 1000)))
			: null

		return [
			{
				key: 'review-volume',
				title: $t('model.review_volume', { ns: 'home' }),
				value: `${week_counts.review}`,
				desc: t_home('summary.total_post_think_reviews', {
					count: total_counts.review
				})
			},
			{
				key: 'review-gap',
				title: $t('model.last_review_gap', { ns: 'home' }),
				value:
					last_report_gap_hours === null
						? $t('model.none', { ns: 'home' })
						: `${last_report_gap_hours}h`,
				desc: this.data.pthink.status.last_report_at
					? t_home('summary.last_review_relative', {
							status: this.data.pthink.status.last_status,
							value: fromNow(this.data.pthink.status.last_report_at)
						})
					: $t('model.no_post_think_review_generated', { ns: 'home' })
			},
			{
				key: 'last-output-mix',
				title: $t('model.last_output_mix', { ns: 'home' }),
				value: last_output_total ? String(last_output_total) : '0',
				desc: last_summary
					? t_home('summary.last_output_mix', {
							articles: last_summary.article_ids.length,
							skills: last_summary.skill_names.length,
							tools: last_summary.tool_names.length
						})
					: $t('model.no_durable_output_yet', { ns: 'home' })
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
